'use strict';
const fetch = require('node-fetch');
const moment = require('moment-timezone');

let apiKey ="666e24e815328961492a1dabd66c6a1f";
let rootUrl ="https://api.darksky.net/forecast/";
let exclude = 'hourly,minutely,alerts,flags';

exports.getForecast = (latitude, longitude,lang, units) => {
  lang = lang || 'en';
  units = units || 'us';
  let uri = `${rootUrl}${apiKey}/${latitude},${longitude}?exclude=${exclude}&units=${units}&lang=${lang}`
  return fetch(uri)
    .then(res => res.json())
    .then((forecast) => {
      // undocumented return format
      //{ code: 400, error: 'The given location (or time) is invalid.' }
      if(forecast.code){
        return {error:{statusCode: forecast.code.toString(), message: forecast.error}};
      }
      moment.locale(lang);
      const timezone = forecast.timezone;
      let currentWeather = forecast.currently;
      let weeklyForecast = forecast.daily.data.map((item) => {
        return {
          icon: item.icon,
          //time is in seconds, moment require millisecond, added timezone property
          day: moment(item.time * 1000).tz(timezone).format('dddd'),
          high: tempFormat(item.temperatureMax),
          low: tempFormat(item.temperatureMin)
        }
      })

       return {
           geolocation: {latitude: forecast.latitude, longitude: forecast.longitude},
           currentWeather: {icon: currentWeather.icon, temperature: tempFormat(currentWeather.temperature)},
           weeklyForecast: weeklyForecast,
       }
    })
    .catch( error => {
      return ({error:{statusCode: '500', message: error.message}});
    });
}

function tempFormat(temp) {
  return Math.round(temp);
}
