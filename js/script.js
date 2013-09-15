;(function () {

  'use strict';

  var app = angular.module('whacMole', []);

  /**
   * randomInt
   * @return {Number} Random integer between 0 and 100
   */
  function randomInt() {
    return (Math.random() * 100) | 0;
  }

  /**
   * Game Constructor
   * @constructor
   * @param {Object} $rootScope
   */
  function Game($rootScope) {
    this.$rootScope = $rootScope;
    this._frameBound = this._frame.bind(this);
    this._timeout = 0;

    this.reset(true);
  }

  // length of a round
  Game.TIMER = 30;
  // update time in ms
  Game.TM_FRAME = 1000;
  // points for hitting a mole
  Game.POINTS = 10;

  /**
   * Reset the state of the game
   * @param  {Boolean} hard tells whether it should be a reset of all props
   */
  Game.prototype.reset = function (hard) {
    clearTimeout(this._timeout);

    this.running = false;
    // score per round
    this.score = 0;
    // current level
    this.level = 1;
    this.timer = Game.TIMER;
    this.moles = [
      0, 0, 0,
      0, 0, 0,
      0, 0, 0
    ];

    if (hard) {
      this.overall = 0;
    }
  };

  /**
   * Start the logic of the game
   */
  Game.prototype.start = function () {
    this.running = true;
    this._timeout = setTimeout(this._frameBound, Game.TM_FRAME);
  };

  /**
   * Stop the logig of a game.
   * Also trigger hard reset.
   */
  Game.prototype.stop = function () {
    this.reset(true);
  };

  /**
   * Logic after hitting a mole.
   * The mole must be visible.
   * @param  {Number} idx index of a mole
   */
  Game.prototype.hit = function (idx) {
    if (this.moles[idx]) {
      this.moles[idx] = 0;
      this.score += Game.POINTS;
    }
  };

  /**
   * Trigger one turn of a logic.
   * @private
   */
  Game.prototype._frame = function () {
    this.timer -= 1;
    this._logic();
    this.$rootScope.$broadcast('game:tick');

    if (this.running) {
      this._timeout = setTimeout(this._frameBound, Game.TM_FRAME);
    }
  };

  /**
   * Main logic
   * @private
   */
  Game.prototype._logic = function () {
    // number of visible mols
    var out = this.moles.filter(function (mole) {
      return mole;
    }).length;

    var n = 9,
      idx = 0,
      mole = 0,
      show = 0;

    while (n--) {
      idx = randomInt() % 9;
      mole = this.moles[idx];

      // mole is out, check if it wants to hide
      if (mole && out > 1 && randomInt() % 2) {
        out -= 1;
        this.moles[idx] = 0;
      }
      // mole is in, check if it wants to show
      else if (!mole && out < 3 && randomInt() % 3 === 0) {
        out += 1;
        this.moles[idx] = 1;
      }
    }

    var win, currLevel;

    if (this.timer === 0) {
      win = this.score >= this._limit();
      currLevel = this.level;

      this.overall += this.score;
      this.$rootScope.$broadcast('game:result', win, this.score, this._limit(), currLevel, this.overall);

      this.reset(!win);

      if (win) {
        this.level = currLevel + 1;
        this.running = true;
      }
    }
  };

  /**
   * Return limit of points per level.
   * @return {Number}
   */
  Game.prototype._limit = function () {
    return (this.level + 1) * 5 * Game.POINTS;
  };

  // Define an instance of the game per $injetor.
  app.factory('game', ['$rootScope', function ($rootScope) {
    return new Game($rootScope);
  }]);

  /**
   * ControlsCtrl
   * Account for UI controls.
   * @param {Object} $scope
   * @param {Object} game
   */
  function ControlsCtrl($scope, game) {
    // Start or stop the game
    $scope.startOrStop = function ($event) {
      if (game.running) {
        game.stop();
      } else {
        game.start();
      }
    };
  }
  ControlsCtrl.$inject = ['$scope', 'game'];
  app.controller('ControlsCtrl', ControlsCtrl);


  /**
   * BoardCtrl
   * @param {Object} $scope
   * @param {Object} game
   */
  function BoardCtrl($scope, game) {
    $scope.hit = function ($index) {
      game.hit($index);
    };
  }
  BoardCtrl.$inject = ['$scope', 'game'];
  app.controller('BoardCtrl', BoardCtrl);


  /**
   * GameCtrl
   * @param {Object} $scope
   * @param {Object} game
   */
  function GameCtrl($scope, game) {
    $scope.game = game;

    // trigger UI update (if needed) after a tick of the game
    $scope.$on('game:tick', function () {
      $scope.$apply();
    });

    $scope.$on('game:result', function (event, win, score, limit, level, overall) {
      $scope.$apply(function () {
        if (win) {
          alert("WIN! Got " + score + "!");
        } else {
          alert("LOSE! Got " + score + " of " + limit + " points in level " + level + "! Overall " + overall);
        }
      });
    });
  }
  GameCtrl.$inject = ['$scope', 'game'];
  app.controller('GameCtrl', GameCtrl);

  // hole directive
  app.directive('hole', function () {
    return {
      restrict: 'E',
      template: '<div class="col-xs-4 hole">' +
        '<div class="circle">' +
          '<div class="mole" ng-show="show" ng-click="onHit({ $index: index })"></div>' +
        '</div>' +
      '</div>',
      replace: true,
      scope: {
        show: '@',
        index: '@',
        onHit: '&'
      }
    };
  });

}());
