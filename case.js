'use strict'

// gently lifted from
// http://stackoverflow.com/posts/6661012/revisions
// and
// http://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase#comment46055254_6661012
// and
// http://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase#comment14968137_6661012

let Case = (function(){
  const POST_HYPHEN_LETTER = /-([a-z])/gi
  , CAMEL_LETTER = /([a-z][A-Z])/g

  let upperCase = ( $0, $1 ) => $1.toUpperCase()
  , lowerCase = ( $0 ) => `${$0[ 0 ]}-${$0[ 1 ].toLowerCase()}`
  , toCamelCase = ( chain ) => chain.replace( POST_HYPHEN_LETTER, upperCase )
  , hyphenize = ( chain ) => chain.replace( CAMEL_LETTER, lowerCase )

  return { toCamelCase, hyphenize }
})

module.exports = new Case()