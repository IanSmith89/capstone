'use strict';

angular.module('salvage')
.directive('comparePassword', [comparePassword]);

function comparePassword() {
  return {
    require: 'ngModel',
    link: function(scope, elem, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue, $scope) {
        var match = viewValue === scope.registration.password.$viewValue;
        if (match) {
          ctrl.$setValidity('match', true);
        } else {
          ctrl.$setValidity('match', false);
        }
        return viewValue;
      });
    }
  };
}
