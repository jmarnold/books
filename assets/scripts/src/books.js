'use strict';

/*global angular*/
/*global window*/

(function(angular, _) {

	var exchange = angular.module('books', ['ngRoute']);

	exchange.config(['$routeProvider', '$locationProvider', function($routeProvider) {
		$routeProvider
			.otherwise({
				templateUrl: 'book-list.html',
				controller: 'bookListController'
			});
	}]);

	exchange.service('bookRepository', ['$q', '$http', function($q, $http) {
		var cache = {};
		var initialized = false;

		function initialize() {
			return $http.get('books.json').success(function(response) { 
				processArray(response);
			});
		}

		function processArray(response) {
			for(var i = 0; i < response.length; i++) {
					var item = response[i];
					if(item && !item.error) {
						if(item instanceof Array) {
							processArray(item);
						}
						else {
							cache[item.ASIN] = item;
							if(!item.MediumImage) {
								item.MediumImage = {
									URL: 'http://placehold.it/108x160&text=no%20image'
								};
							}
						}
					}
				}
		}

		function mapCache() {
			var items = [];
			for(var key in cache) {
				items.push(cache[key]);
			}

			return _.sortBy(items, function(item) { 
				if (!item.ItemAttributes) return '';
				return item.ItemAttributes.Title; 
			});
		}

		function load() {
			var defer = $q.defer();

			if (initialized) {
				defer.resolve(mapCache());
				return defer.promise;
			}

			initialize().success(function() {
				defer.resolve(mapCache());
				initialized = true;
			});

			return defer.promise;
		}

		return {
			get: function(id) {
				var defer = $q.defer();

				load().then(function() {
					var item = cache[id];
					if (!item)
						defer.reject('Could not find "' + id + '" in the cache');

					defer.resolve(item);
				});

				return defer.promise;
			},
			all: load
		};
	}]);

	exchange.controller('bookListController', ['$scope', 'bookRepository', '$location', function($scope, repository, $location) {
		$scope.items = [];

		function groupItems(items, itemsPerRow) {
			var groupedItems = [];

			for (var i = 0; i < items.length; i += itemsPerRow) {
				groupedItems.push({
					items: items.slice(i, i + itemsPerRow)
				});
			}

			return groupedItems;
		}

		$scope.viewBook = function(book) {
			$location.path('/books/' + book.ASIN).replace();
		};

		repository.all().then(function(response) { 
			$scope.itemGroups = groupItems(response, 3);
		});
	}]);


}(angular, _));