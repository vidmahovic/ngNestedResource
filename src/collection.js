angular.module('ngNestedResource')
    .factory('BaseCollection', function() {
        var BaseCollection = function (model, perPage, pageNumber) {
            this.model = model;
            this.queryParams = {};
            this.page = pageNumber ? pageNumber : 1;
            this.perPage = perPage ? perPage : 20;
            this.totalItems;
            this.totalPages;
            this.pages = [];
        };
        BaseCollection.prototype = new Array();

        BaseCollection.prototype.populate = function (data) {
            var collection = this;
            collection.clear();

            data.forEach(function(obj) {
                collection.push(new collection.model(obj));
            });

            return collection;
        };

        BaseCollection.prototype.loadMore = function (take, success, error) {
            if (this.allLoaded()) {
                // no need to generate another request in this  case
                return this;
            }

            var collection = this;

            this.queryParams.take = take ? take : this.perPage;
            this.queryParams.skip = this.length;

            return this.model.list(this.queryParams, success, error).then(function (results) {
                angular.forEach(results, function (item) {
                    collection.push(item);
                });

                return collection;
            });
        };

        BaseCollection.prototype.query = function (params, success, error) {
            var collection = this;
            collection.queryParams = params ? params : {};

            if (!collection.queryParams.take) {
                collection.queryParams.take = collection.perPage;
            }

            return this.model.list(params, success, error).then(function (results) {
                collection.clear();
                angular.forEach(results, function (item) {
                    collection.push(item);
                });

                return collection;
            });
        };

        BaseCollection.prototype.filter = function (params, success, error) {
            var collection = this;
            angular.extend(collection.queryParams, params);

            return this.model.list(params, success, error).then(function (results) {
                collection.clear();
                angular.forEach(results, function (item) {
                    collection.push(item);
                });

                return collection;
            });
        };

        BaseCollection.prototype.clear = function () {
            while(this.length > 0) {
                this.pop();
            }
        };

        BaseCollection.prototype.allLoaded = function () {
            return angular.isUndefined(this.queryParams.take) || this.queryParams.take > this.length;
        };

        // pagination methods
        BaseCollection.prototype.count = function (success, error) {
            var collection = this;

            return this.model.count(this.queryParams, function (count) {
                collection.totalItems = count;
                collection.totalPages = (collection.totalItems >= collection.perPage) ? parseInt(collection.totalItems / collection.perPage) : 1;

                collection.pages = [];
                for (i = 1; i <= collection.totalPages ; i++ ) {
                    collection.pages.push({
                        number: i,
                        text: i
                    });
                }

                return count;
            });
        };

        BaseCollection.prototype.selectPage = function (page, params, success, error) {
            if (page > this.totalPages || page < 1) {
                return ;
            }

            if (params) {
                this.queryParams = params;
            }

            var collection = this;

            this.queryParams.take = this.perPage;
            this.queryParams.skip = (page - 1)  * this.perPage;
            this.page = page;

            return this.model.list(this.queryParams, success, error).then(function (results) {
                collection.clear();
                angular.forEach(results, function (item) {
                    collection.push(item);
                });

                return collection;
            });

        };

        BaseCollection.prototype.noPrevious = function () {
            return this.page === 1;
        };

        BaseCollection.prototype.noNext = function () {
            return this.page === this.totalPages;
        };

        BaseCollection.prototype.remove = function (model) {
            var index = -1;

            angular.forEach(this, function (item, k) {
                if (index == -1 && item.id == model.id) {
                    index = k;
                }
            });

            if (index > -1) {
                this.splice(index, 1);
            }

            model.destroy();
        };

        return function (model) {
            var Collection = function(perPage, pageNumber) {
                return new BaseCollection(model, perPage, pageNumber);
            };
            Collection.prototype = BaseCollection.prototype;
            Collection.model = model;

            return Collection;
        };
    });
