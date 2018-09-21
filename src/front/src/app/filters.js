'use strict';

// Filter to pretty print json
angular.module('topcoderX')
  .filter('prettyJSON', function () {
    return function (json) {
      return angular.toJson(json, true);
    };
  })
  .filter('capitalize', function () {
    return function (input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    };
  })
  .filter('hourSince', function () {
    return function (date) {
      if (!date) {
        return;
      }
      var time = Date.parse(date);
      var difference = new Date() - time;
      var hours = difference / (1000 * 60 * 60);
      if (hours < 1) {
        return hours.toFixed(1);
      }
      return parseInt(hours, 10);
    };
  })
  .filter('hourSinceClass', function () {
    return function (hour) {
      if (!hour) {
        return;
      }
      var hoursInt = parseInt(hour, 10);
      if (hoursInt < 18) {
        return 'text-info';
      } else if (hoursInt >= 18 && hoursInt < 24) {
        return 'text-warning';
      } else if (hoursInt >= 24) {
        return 'text-danger';
      }
    };
  });
