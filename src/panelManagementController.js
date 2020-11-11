var app = angular.module('frControllers', []);

angular.module('frControllers').controller(
    'PanelManagementController', 
    ['$rootScope', '$scope', '$stateParams', '$window', 
      'ChannelService', 'TrackingService',
      'SubscriptionService', 'NavigationService',
function($rootScope, $scope, $stateParams, $window, ChannelService, TrackingService,
SubscriptionService, NavigationService) {
  var initialCardsInfo = [];
  var nonCustomizableCards = [];
  var parentChannelId = null;
  var parentChannelType = null;
  var channelId = $stateParams.channelId;
  var channelType = $stateParams.channelType;
  var canceledNavigationUrl = '';
  var unsavedChangesConfirmed = false;

  $scope.carouselController = {};
  $scope.isLoading = true;
  $scope.unsavedChangesModalController = {};
  $scope.addedCardsInfo = [];
  $scope.removedCardsInfo = [];
  $scope.availableCardsInfo = [];

  function loadChannelCards() {
    ChannelService.loadAvailableChannelCardsInfo({
      id: channelId, channelType: channelType || parentChannelType
    }, parentChannelId).then(function(cardsInfo) {
      $scope.addedCardsInfo = [];
      $scope.removedCardsInfo = [];
      $scope.availableCardsInfo = [];
      nonCustomizableCards.splice(0, nonCustomizableCards.length);

      for (var i in cardsInfo) {
        var info = cardsInfo[i];
        if (info.card.cardType != 'DETAIL_VIEW') {
          if (info.isCustomizable) {
            $scope.availableCardsInfo.push(info);
            if (info.isAdded) {
              $scope.addedCardsInfo.push(info);
            }
          } else if (info.isAdded) {
            nonCustomizableCards.push(info.card);
          }
        } else {
          nonCustomizableCards.push(info.card);
        }
      }
      initialCardsInfo.splice.apply(initialCardsInfo, [0, initialCardsInfo.length].concat($scope.addedCardsInfo));
      $scope.isLoading = false;
    });
  }

  function isLayoutChanged() {
    if (initialCardsInfo.length != $scope.addedCardsInfo.length) {
      return true;
    }
    for (var i in initialCardsInfo) {
      if (initialCardsInfo[i].card.id != $scope.addedCardsInfo[i].card.id) {
        return true;
      }
    }
    return false;
  }

  var loadPrimaryChannelCards = false;
  if (FREnv.$rootScope.channelToRender && FREnv.$rootScope.channelToRender.channelType == 'SINGLE_ACCOUNT' &&
    FREnv.$rootScope.channelToRender.items && FREnv.$rootScope.channelToRender.items[0].id == $stateParams.interest) {
    loadPrimaryChannelCards = true;
  }

  if ($stateParams.interest && !loadPrimaryChannelCards) {
    ChannelService.loadEntityChannelInfo({
      id: channelId, channelType: channelType
    }).then(function(channelInfo) {
      parentChannelType = channelType;
      parentChannelId = channelId;
      channelId = channelInfo.id;
      channelType = channelInfo.channelType;
      if (FREnv.$rootScope.channelToRender && FREnv.$rootScope.channelToRender.channelType == 'SINGLE_ACCOUNT') {
        channelType = FREnv.$rootScope.channelToRender.channelType;
      }
      loadChannelCards();
    });
  } else {
    loadChannelCards();
  }

  $scope.addCard = function(info) {
    var index = $scope.addedCardsInfo.indexOf(info);
    if (index == -1) {
      info.isAdded = true;
      $scope.addedCardsInfo.push(info);
    }
  };

  $scope.removeCard = function(info) {
    var index = $scope.addedCardsInfo.indexOf(info);
    if (index > -1) {
      $scope.addedCardsInfo.splice(index, 1);
      info.isAdded = false;
      $scope.removedCardsInfo.push(info);
    }
  };

  $scope.saveChannelLayout = function() {
    var cardIdToOrder = {};
    $.each($scope.addedCardsInfo, function(index) {
      cardIdToOrder[this.card.id] = index;
    });
    $.each(nonCustomizableCards, function() {
      cardIdToOrder[this.id] = this.cardOrder;
    });
    $.each($scope.removedCardsInfo, function() {
      if (FREnv.$rootScope.channelToRender && FREnv.$rootScope.channelToRender.channelType == 'ACCOUNT' &&
        this.card.cardType == 'WHO_TO_CALL' && !FREnv.$rootScope.channelSubViewToRender) {
        var existingSubscription = {'channelId': channelId, 'cardId': this.card.id,
            'shareId': FREnv.$rootScope.channelToRender.shareId};
        var toRemove = [];
        toRemove.push(existingSubscription);
        SubscriptionService.updateSubscriptions([], toRemove);
      }
    });
    $scope.isLoading = true;
    ChannelService.replaceCards(channelId, parentChannelId, cardIdToOrder).then(function() {
      //clearing cardList cache to enable fresh fetch of cardList after replacing cards
      if (FREnv.$rootScope.channelSubViewToRender) {
        for (var i in FREnv.$rootScope.channelToRender.items) {
          var item = FREnv.$rootScope.channelToRender.items[i];
          if (item.channel) {
            item.channel.cardList = [];
          }
        }
      } else {
        FREnv.$rootScope.channelToRender.cardList = [];
      }
      initialCardsInfo.splice.apply(initialCardsInfo, [0, initialCardsInfo.length].concat($scope.addedCardsInfo));
      $scope.isLoading = false;
      var params = {
        id: $stateParams.channelId, channelView: 'summary'
      };
      if ($stateParams.interest && !loadPrimaryChannelCards) {
        //params.itemId = $stateParams.interest;
        params.iid = $stateParams.interest;
      }
      NavigationService.searchLanding(params);
    });
  };

  $scope.carouselNext = function() {
    $scope.carouselController.nextN();
  };

  $scope.carouselPrev = function() {
    $scope.carouselController.prevPage();
  };

  $scope.cancelLocationChange = function() {
    $scope.unsavedChangesModalController.close();
  };

  $scope.discardUnsavedChanges = function() {
    $scope.unsavedChangesModalController.close();
    unsavedChangesConfirmed = true;
    $window.location.href = canceledNavigationUrl;
  };

  $scope.canMoveNext = function() {
    return $scope.carouselController.canMoveNext && $scope.carouselController.canMoveNext();
  };

  $scope.canMovePrev = function() {
    return $scope.carouselController.canMovePrev && $scope.carouselController.canMovePrev();
  };

  $scope.savedChangesAndContinueNavigation = function() {
    $scope.saveChannelLayout();
  };

  $scope.beforeSortPanels = function(startIndex, endIndex) {
    return endIndex !== 0;
  };

  $scope.afterSortPanels = function() {
    TrackingService.track({
      activityType: 'sort',
      section: 'panelmanagement',
      target: 'channel',
      targetId: channelId
    });
  };

  function beforeWindowUnload() {
    if (isLayoutChanged()) {
      return 'You have unsaved changes, do you want to continue?';
    }
  }

  angular.element($window).on('beforeunload', beforeWindowUnload);

  var disableLocationChangeStart = $rootScope.$on('$locationChangeStart', function(event, newUrl) {
    if (isLayoutChanged() && !unsavedChangesConfirmed) {
      event.preventDefault();
      canceledNavigationUrl = newUrl;
      $scope.saveChannelLayout();
    }
  });
  $scope.$on('$destroy', function() {
    disableLocationChangeStart();
    angular.element($window).off('beforeunload', beforeWindowUnload);
  });
}]);