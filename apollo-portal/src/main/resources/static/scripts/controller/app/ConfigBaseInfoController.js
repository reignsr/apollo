application_module.controller("ConfigBaseInfoController",
                              ['$rootScope', '$scope', '$location', 'toastr', 'AppService', 'AppUtil',
                               function ($rootScope, $scope, $location, toastr, AppService, AppUtil) {


                                   var appId = AppUtil.parseParams($location.$$url).appid;
                                   var pageContext = {
                                       appId: appId,
                                       env: '',
                                       clusterName: 'default'
                                   };

                                   $rootScope.pageContext = pageContext;

                                   ////// load cluster nav tree //////

                                   AppService.load_nav_tree($rootScope.pageContext.appId).then(function (result) {
                                       var navTree = [];
                                       var nodes = result.nodes;
                                       nodes.forEach(function (item) {
                                           var node = {};
                                           //first nav
                                           node.text = item.env;
                                           var clusterNodes = [];
                                           //如果env下面只有一个default集群则不显示集群列表
                                           if (item.clusters && item.clusters.length == 1 && item.clusters[0].name == 'default'){
                                               node.selectable = true;
                                           }else {
                                               node.selectable = false;
                                               //second nav
                                               item.clusters.forEach(function (item) {
                                                   var clusterNode = {},
                                                       parentNode = [];

                                                   clusterNode.text = item.name;
                                                   parentNode.push(node.text);
                                                   clusterNode.tags = parentNode;
                                                   clusterNodes.push(clusterNode);
                                               });
                                           }
                                           node.nodes = clusterNodes;
                                           navTree.push(node);
                                       });
                                       $('#treeview').treeview({
                                                                   color: "#428bca",
                                                                   showBorder: true,
                                                                   data: navTree,
                                                                   levels: 99,
                                                                   onNodeSelected: function (event, data) {
                                                                       if (!data.tags){//first nav node
                                                                           $rootScope.pageContext.env = data.text;
                                                                           $rootScope.pageContext.clusterName = 'default';
                                                                       }else {//second cluster node
                                                                           $rootScope.pageContext.env = data.tags[0];
                                                                           $rootScope.pageContext.clusterName = data.text;
                                                                       }
                                                                       $rootScope.refreshNamespaces();
                                                                   }
                                                               });
                                   }, function (result) {
                                       toastr.error(AppUtil.errorMsg(result), "加载导航出错");
                                   });

                                   ////// app info //////

                                   AppService.load($rootScope.pageContext.appId).then(function (result) {
                                       $scope.appBaseInfo = result.app;
                                       $scope.missEnvs = result.missEnvs;
                                       $scope.selectedEnvs = angular.copy($scope.missEnvs);
                                   },function (result) {
                                       toastr.error(AppUtil.errorMsg(result), "加载App信息出错");
                                   });


                                   ////// 补缺失的环境 //////

                                   $scope.toggleSelection = function toggleSelection(env) {
                                       var idx = $scope.selectedEnvs.indexOf(env);

                                       // is currently selected
                                       if (idx > -1) {
                                           $scope.selectedEnvs.splice(idx, 1);
                                       }

                                       // is newly selected
                                       else {
                                           $scope.selectedEnvs.push(env);
                                       }
                                   };

                                   $scope.createEnvs = function () {
                                       var count = 0;
                                       $scope.selectedEnvs.forEach(function (env) {
                                           AppService.create(env, $scope.appBaseInfo).then(function (result) {
                                               toastr.success(env, '创建成功');
                                               count ++;
                                               if (count == $scope.selectedEnvs.length){
                                                   location.reload(true);
                                               }
                                           }, function (result) {
                                               toastr.error(AppUtil.errorMsg(result), '创建失败:' + env);
                                               count ++;
                                               if (count == $scope.selectedEnvs){
                                                   $route.reload();
                                               }
                                           });
                                       });
                                   };

                               }]);

