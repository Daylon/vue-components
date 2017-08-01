'use strict'
import Vue from 'vue'
import Case from 'case'

let VueComponent = function() {
	const PROPERTY_RADIX = 'data-component--',
		REGEXP_PROPERTY = new RegExp(`^${PROPERTY_RADIX}`),
		VUE_EVENT_BUS = new Vue()

	let $mainVue = null,
		$templateNames = [],
		$templateProperties = [],
		$templateCache = [],
		_promises = [],
		$parser = new DOMParser()

	// utils
	let generateUID = (name = '', strength = 12, b = '', a = 1) => {
			while (a < strength) {
				b +=
					(a * 51) & 52
						? (a ^ 15 ? 8 ^ (Math.random() * (a ^ 20 ? 16 : 4)) : 4).toString(
								16
							)
						: '-'
				a++
			}
			return `${name}${name.length > 0 ? '--' : ''}${b}`
		},
		trimValues = (value = '') => `${value}`.trim(),
		concat = function(...list) {
			return list.map(trimValues).join(' ')
		},
		// hooks
		getMainVue = () => $mainVue,
		getEventBus = () => VUE_EVENT_BUS,
		// build
		register = function(components, options = null) {
			const PROMISES = []
				.concat(components)
				.map(component => registerOneComponent(`${component}`))
			return Promise.all(PROMISES)
				.then(_templates => {
					for (let _html of _templates) {
						let { _template, _props } = getTemplateProperties(_html)
						prepare(`${_template}`, _props)
					}
				})
				.then(() => (options !== null ? set(options) : null))
		},
		isolateComponentName = function(componentName) {
			if (/\?noscript$/i.test(componentName) === true) {
				return [componentName.replace(/^(.*)\?noscript$/i, '$1'), '?noscript=1']
			} else {
				return [componentName, '']
			}
		},
		registerOneComponent = function(componentName) {
			let _splitComponentName = isolateComponentName(componentName),
				$index = $templateNames.findIndex(
					(name, index) => name === _splitComponentName[0]
				)
			if ($index === -1) {
				return fetchTemplate(_splitComponentName[0], _splitComponentName[1])
			} else {
				return build($templateCache[$index], name, $templateProperties[$index])
			}
		},
		fetchTemplate = (componentName, noscript = '') =>
			System['import'](`/api/get-component/${componentName}${noscript}!text`),
		getTemplateProperties = function(template = '') {
			let _node = $parser.parseFromString(template, 'text/html'),
				_body = _node.getElementsByTagName('body').item(0),
				_scriptNode = null,
				_target = _body.childNodes.item(0),
				_propertyName = '',
				_props = {
					name: '',
					properties: [],
					methods: {}
				}

			for (let _prop of Array.from(_target.attributes)) {
				if (_prop != 'prototype' && _prop != 'length') {
					if (REGEXP_PROPERTY.test(_prop.name) === true) {
						_propertyName = _prop.name.substring(PROPERTY_RADIX.length)
						if (_propertyName === 'name') {
							_props.name = _prop.value
						} else {
							_props.properties.push(Case.toCamelCase(_propertyName))
						}
					}
				}
			}
			_scriptNode = _node !== null ? _node.getElementsByTagName('script') : null
			if (_scriptNode && _scriptNode[0]) {
				_props.methods = eval(_scriptNode[0].innerHTML).make(
					getMainVue,
					getEventBus
				)
			}
			return { _template: _target.outerHTML, _props }
		},
		prepare = function(template, _props) {
			$templateNames.push(_props.name)
			$templateProperties.push(_props.properties)
			$templateCache.push(template)
			build(template, _props.name, _props.properties, _props.methods)
		},
		build = function(template, name, props = {}, methods = {}) {
			Object.assign(methods, { generateUID, concat }) // utilities
			let _component = Vue.extend({
				template,
				props,
				methods,
				data: () => ({ uniqueId: generateUID(name) })
			})
			Vue.component(name, _component)
		},
		set = function(options) {
			try {
				return new Vue(options)
			} catch (err) {
				console.error(err)
				return null
			}
		},
		addEventListener = (_eventName, _callback) =>
			VUE_EVENT_BUS.$on(_eventName, _callback),
		fireEvent = (_eventName, ...args) =>
			VUE_EVENT_BUS.$emit(_eventName, ...args),
		track = function(_vue) {
			$mainVue = _vue
			$mainVue.$nextTick(function() {
				for (let component of $mainVue.$children) {
					if (component.init) component.init()
				}
			})
		}

	return { register, set, addEventListener, fireEvent, track, generateUID }
}

module.exports = new VueComponent()
