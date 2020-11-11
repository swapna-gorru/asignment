function trim( text ) {
  return (text || '').replace( /^\s+|\s+$/g, '' );
} 

function param ( array ) {
  var s = [ ];
  function add( key, value ){
    s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }
  for(var key in array)
    add(key, array[key]); 
  return s.join('&').replace(/%20/g, '+');
}

function urlToParamsMap(url, decode){
  var map = {};
  var parts = url.split(/(\?|&|#)/);
  for(var part in parts){
    var keyVal = parts[part].split('=');
    if(keyVal.length == 2){
      //must be 2 since we are chopping xx=yy
      var key = trim(keyVal[0]);
      var value = trim(decodeURIComponent(keyVal[1]));
      if(key && key != '')
        map[key] = value;
    }
  }
  return map;
}

exports.trim = trim;
exports.param = param;
exports.urlToParamsMap = urlToParamsMap;
