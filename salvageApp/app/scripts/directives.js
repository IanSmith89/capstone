'use strict';

angular.module('salvage')
.directive('comparePassword', [comparePassword]);

function comparePassword() {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue, $scope) {
        var noMatch = viewValue !== scope.registration.password.$viewValue;
        if (noMatch) {
          ctrl.$setValidity('match', false);
        } else {
          ctrl.$setValidity('match', true);
        }
        return viewValue;
      });
    }
  };
}
