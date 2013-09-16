angular.module("ui.bootstrap", ["ui.mask","ui.bootstrap.typeahead","ui.bootstrap.collapse"]);

angular.module('ui.mask', [])
  .value('uiMaskConfig', {
    'maskDefinitions': {
      '9': /\d/,
      'A': /[a-zA-Z]/,
      '*': /[a-zA-Z0-9]/
    }
  })
  .directive('uiMask', ['uiMaskConfig', function (maskConfig) {
    return {
      priority: 100,
      require: 'ngModel',
      restrict: 'A',
      compile: function uiMaskCompilingFunction(){
        var options = maskConfig;

        return function uiMaskLinkingFunction(scope, iElement, iAttrs, controller){
          var maskProcessed = false, eventsBound = false,
            maskCaretMap, maskPatterns, maskPlaceholder, maskComponents,
          // Minimum required length of the value to be considered valid
            minRequiredLength,
            value, valueMasked, isValid,
          // Vars for initializing/uninitializing
            originalPlaceholder = iAttrs.placeholder,
            originalMaxlength = iAttrs.maxlength,
          // Vars used exclusively in eventHandler()
            oldValue, oldValueUnmasked, oldCaretPosition, oldSelectionLength;

          function initialize(maskAttr){
            if (!angular.isDefined(maskAttr)) {
              return uninitialize();
            }
            processRawMask(maskAttr);
            if (!maskProcessed) {
              return uninitialize();
            }
            initializeElement();
            bindEventListeners();
            return true;
          }

          function initPlaceholder(placeholderAttr) {
            if(! angular.isDefined(placeholderAttr)) {
              return;
            }

            maskPlaceholder = placeholderAttr;

            // If the mask is processed, then we need to update the value
            if (maskProcessed) {
              eventHandler();
            }
          }

          function formatter(fromModelValue){
            if (!maskProcessed) {
              return fromModelValue;
            }
            value = unmaskValue(fromModelValue || '');
            isValid = validateValue(value);
            controller.$setValidity('mask', isValid);
            return isValid && value.length ? maskValue(value) : undefined;
          }

          function parser(fromViewValue){
            if (!maskProcessed) {
              return fromViewValue;
            }
            value = unmaskValue(fromViewValue || '');
            isValid = validateValue(value);
            // We have to set viewValue manually as the reformatting of the input
            // value performed by eventHandler() doesn't happen until after
            // this parser is called, which causes what the user sees in the input
            // to be out-of-sync with what the controller's $viewValue is set to.
            controller.$viewValue = value.length ? maskValue(value) : '';
            controller.$setValidity('mask', isValid);
            if (value === '' && controller.$error.required !== undefined) {
              controller.$setValidity('required', false);
            }
            return isValid ? value : undefined;
          }

          var linkOptions = {};

          if (iAttrs.uiOptions) {
            linkOptions = scope.$eval('[' + iAttrs.uiOptions + ']');
            if (angular.isObject(linkOptions[0])) {
              // we can't use angular.copy nor angular.extend, they lack the power to do a deep merge
              linkOptions = (function(original, current){
                for(var i in original) {
                  if (Object.prototype.hasOwnProperty.call(original, i)) {
                    if (!current[i]) {
                      current[i] = angular.copy(original[i]);
                    } else {
                      angular.extend(current[i], original[i]);
                    }
                  }
                }
                return current;
              })(options, linkOptions[0]);
            }
          } else {
            linkOptions = options;
          }

          iAttrs.$observe('uiMask', initialize);
          iAttrs.$observe('placeholder', initPlaceholder);
          controller.$formatters.push(formatter);
          controller.$parsers.push(parser);

          function uninitialize(){
            maskProcessed = false;
            unbindEventListeners();

            if (angular.isDefined(originalPlaceholder)) {
              iElement.attr('placeholder', originalPlaceholder);
            } else {
              iElement.removeAttr('placeholder');
            }

            if (angular.isDefined(originalMaxlength)) {
              iElement.attr('maxlength', originalMaxlength);
            } else {
              iElement.removeAttr('maxlength');
            }

            iElement.val(controller.$modelValue);
            controller.$viewValue = controller.$modelValue;
            return false;
          }

          function initializeElement(){
            value = oldValueUnmasked = unmaskValue(controller.$modelValue || '');
            valueMasked = oldValue = maskValue(value);
            isValid = validateValue(value);
            var viewValue = isValid && value.length ? valueMasked : '';
            if (iAttrs.maxlength) { // Double maxlength to allow pasting new val at end of mask
              iElement.attr('maxlength', maskCaretMap[maskCaretMap.length - 1] * 2);
            }
            iElement.attr('placeholder', maskPlaceholder);
            iElement.val(viewValue);
            controller.$viewValue = viewValue;
            // Not using $setViewValue so we don't clobber the model value and dirty the form
            // without any kind of user interaction.
          }

          function bindEventListeners(){
            if (eventsBound) {
              return;
            }
            iElement.bind('blur', blurHandler);
            iElement.bind('mousedown mouseup', mouseDownUpHandler);
            iElement.bind('input keyup click focus', eventHandler);
            eventsBound = true;
          }

          function unbindEventListeners(){
            if (!eventsBound) {
              return;
            }
            iElement.unbind('blur', blurHandler);
            iElement.unbind('mousedown', mouseDownUpHandler);
            iElement.unbind('mouseup', mouseDownUpHandler);
            iElement.unbind('input', eventHandler);
            iElement.unbind('keyup', eventHandler);
            iElement.unbind('click', eventHandler);
            iElement.unbind('focus', eventHandler);
            eventsBound = false;
          }

          function validateValue(value){
            // Zero-length value validity is ngRequired's determination
            return value.length ? value.length >= minRequiredLength : true;
          }

          function unmaskValue(value){
            var valueUnmasked = '',
              maskPatternsCopy = maskPatterns.slice();
            // Preprocess by stripping mask components from value
            value = value.toString();
            angular.forEach(maskComponents, function (component){
              value = value.replace(component, '');
            });
            angular.forEach(value.split(''), function (chr){
              if (maskPatternsCopy.length && maskPatternsCopy[0].test(chr)) {
                valueUnmasked += chr;
                maskPatternsCopy.shift();
              }
            });
            return valueUnmasked;
          }

          function maskValue(unmaskedValue){
            var valueMasked = '',
                maskCaretMapCopy = maskCaretMap.slice();

            angular.forEach(maskPlaceholder.split(''), function (chr, i){
              if (unmaskedValue.length && i === maskCaretMapCopy[0]) {
                valueMasked  += unmaskedValue.charAt(0) || '_';
                unmaskedValue = unmaskedValue.substr(1);
                maskCaretMapCopy.shift();
              }
              else {
                valueMasked += chr;
              }
            });
            return valueMasked;
          }

          function getPlaceholderChar(i) {
            var placeholder = iAttrs.placeholder;

            if (typeof placeholder !== "undefined" && placeholder[i]) {
              return placeholder[i];
            } else {
              return "_";
            }
          }

          // Generate array of mask components that will be stripped from a masked value
          // before processing to prevent mask components from being added to the unmasked value.
          // E.g., a mask pattern of '+7 9999' won't have the 7 bleed into the unmasked value.
          // If a maskable char is followed by a mask char and has a mask
          // char behind it, we'll split it into it's own component so if
          // a user is aggressively deleting in the input and a char ahead
          // of the maskable char gets deleted, we'll still be able to strip
          // it in the unmaskValue() preprocessing.
          function getMaskComponents() {
            return maskPlaceholder.replace(/[_]+/g, '_').replace(/([^_]+)([a-zA-Z0-9])([^_])/g, '$1$2_$3').split('_');
          }

          function processRawMask(mask){
            var characterCount = 0;

            maskCaretMap    = [];
            maskPatterns    = [];
            maskPlaceholder = '';

            if (typeof mask === 'string') {
              minRequiredLength = 0;

              var isOptional = false,
                  splitMask  = mask.split("");

              angular.forEach(splitMask, function (chr, i){
                if (linkOptions.maskDefinitions[chr]) {

                  maskCaretMap.push(characterCount);

                  maskPlaceholder += getPlaceholderChar(i);
                  maskPatterns.push(linkOptions.maskDefinitions[chr]);

                  characterCount++;
                  if (!isOptional) {
                    minRequiredLength++;
                  }
                }
                else if (chr === "?") {
                  isOptional = true;
                }
                else {
                  maskPlaceholder += chr;
                  characterCount++;
                }
              });
            }
            // Caret position immediately following last position is valid.
            maskCaretMap.push(maskCaretMap.slice().pop() + 1);

            maskComponents = getMaskComponents();
            maskProcessed  = maskCaretMap.length > 1 ? true : false;
          }

          function blurHandler(){
            oldCaretPosition = 0;
            oldSelectionLength = 0;
            if (!isValid || value.length === 0) {
              valueMasked = '';
              iElement.val('');
              scope.$apply(function (){
                controller.$setViewValue('');
              });
            }
          }

          function mouseDownUpHandler(e){
            if (e.type === 'mousedown') {
              iElement.bind('mouseout', mouseoutHandler);
            } else {
              iElement.unbind('mouseout', mouseoutHandler);
            }
          }

          iElement.bind('mousedown mouseup', mouseDownUpHandler);

          function mouseoutHandler(){
            oldSelectionLength = getSelectionLength(this);
            iElement.unbind('mouseout', mouseoutHandler);
          }

          function eventHandler(e){
            e = e || {};
            // Allows more efficient minification
            var eventWhich = e.which,
              eventType = e.type;

            // Prevent shift and ctrl from mucking with old values
            if (eventWhich === 16 || eventWhich === 91) { return;}

            var val = iElement.val(),
              valOld = oldValue,
              valMasked,
              valUnmasked = unmaskValue(val),
              valUnmaskedOld = oldValueUnmasked,
              valAltered = false,

              caretPos = getCaretPosition(this) || 0,
              caretPosOld = oldCaretPosition || 0,
              caretPosDelta = caretPos - caretPosOld,
              caretPosMin = maskCaretMap[0],
              caretPosMax = maskCaretMap[valUnmasked.length] || maskCaretMap.slice().shift(),

              selectionLenOld = oldSelectionLength || 0,
              isSelected = getSelectionLength(this) > 0,
              wasSelected = selectionLenOld > 0,

            // Case: Typing a character to overwrite a selection
              isAddition = (val.length > valOld.length) || (selectionLenOld && val.length > valOld.length - selectionLenOld),
            // Case: Delete and backspace behave identically on a selection
              isDeletion = (val.length < valOld.length) || (selectionLenOld && val.length === valOld.length - selectionLenOld),
              isSelection = (eventWhich >= 37 && eventWhich <= 40) && e.shiftKey, // Arrow key codes

              isKeyLeftArrow = eventWhich === 37,
            // Necessary due to "input" event not providing a key code
              isKeyBackspace = eventWhich === 8 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === -1)),
              isKeyDelete = eventWhich === 46 || (eventType !== 'keyup' && isDeletion && (caretPosDelta === 0 ) && !wasSelected),

            // Handles cases where caret is moved and placed in front of invalid maskCaretMap position. Logic below
            // ensures that, on click or leftward caret placement, caret is moved leftward until directly right of
            // non-mask character. Also applied to click since users are (arguably) more likely to backspace
            // a character when clicking within a filled input.
              caretBumpBack = (isKeyLeftArrow || isKeyBackspace || eventType === 'click') && caretPos > caretPosMin;

            oldSelectionLength = getSelectionLength(this);

            // These events don't require any action
            if (isSelection || (isSelected && (eventType === 'click' || eventType === 'keyup'))) {
              return;
            }

            // Value Handling
            // ==============

            // User attempted to delete but raw value was unaffected--correct this grievous offense
            if ((eventType === 'input') && isDeletion && !wasSelected && valUnmasked === valUnmaskedOld) {
              while (isKeyBackspace && caretPos > caretPosMin && !isValidCaretPosition(caretPos)) {
                caretPos--;
              }
              while (isKeyDelete && caretPos < caretPosMax && maskCaretMap.indexOf(caretPos) === -1) {
                caretPos++;
              }
              var charIndex = maskCaretMap.indexOf(caretPos);
              // Strip out non-mask character that user would have deleted if mask hadn't been in the way.
              valUnmasked = valUnmasked.substring(0, charIndex) + valUnmasked.substring(charIndex + 1);
              valAltered = true;
            }

            // Update values
            valMasked = maskValue(valUnmasked);

            oldValue = valMasked;
            oldValueUnmasked = valUnmasked;
            iElement.val(valMasked);
            if (valAltered) {
              // We've altered the raw value after it's been $digest'ed, we need to $apply the new value.
              scope.$apply(function (){
                controller.$setViewValue(valUnmasked);
              });
            }

            // Caret Repositioning
            // ===================

            // Ensure that typing always places caret ahead of typed character in cases where the first char of
            // the input is a mask char and the caret is placed at the 0 position.
            if (isAddition && (caretPos <= caretPosMin)) {
              caretPos = caretPosMin + 1;
            }

            if (caretBumpBack) {
              caretPos--;
            }

            // Make sure caret is within min and max position limits
            caretPos = caretPos > caretPosMax ? caretPosMax : caretPos < caretPosMin ? caretPosMin : caretPos;

            // Scoot the caret back or forth until it's in a non-mask position and within min/max position limits
            while (!isValidCaretPosition(caretPos) && caretPos > caretPosMin && caretPos < caretPosMax) {
              caretPos += caretBumpBack ? -1 : 1;
            }

            if ((caretBumpBack && caretPos < caretPosMax) || (isAddition && !isValidCaretPosition(caretPosOld))) {
              caretPos++;
            }
            oldCaretPosition = caretPos;
            setCaretPosition(this, caretPos);
          }

          function isValidCaretPosition(pos){ return maskCaretMap.indexOf(pos) > -1; }

          function getCaretPosition(input){
            if (input.selectionStart !== undefined) {
              return input.selectionStart;
            } else if (document.selection) {
              // Curse you IE
              input.focus();
              var selection = document.selection.createRange();
              selection.moveStart('character', -input.value.length);
              return selection.text.length;
            }
            return 0;
          }

          function setCaretPosition(input, pos){
            if (input.offsetWidth === 0 || input.offsetHeight === 0) {
              return; // Input's hidden
            }
            if (input.setSelectionRange) {
              input.focus();
              input.setSelectionRange(pos, pos);
            }
            else if (input.createTextRange) {
              // Curse you IE
              var range = input.createTextRange();
              range.collapse(true);
              range.moveEnd('character', pos);
              range.moveStart('character', pos);
              range.select();
            }
          }

          function getSelectionLength(input){
            if (input.selectionStart !== undefined) {
              return (input.selectionEnd - input.selectionStart);
            }
            if (document.selection) {
              return (document.selection.createRange().text.length);
            }
            return 0;
          }

          // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
          if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function (searchElement /*, fromIndex */){
              "use strict";
              if (this === null) {
                throw new TypeError();
              }
              var t = Object(this);
              var len = t.length >>> 0;
              if (len === 0) {
                return -1;
              }
              var n = 0;
              if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n !== n) { // shortcut for verifying if it's NaN
                  n = 0;
                } else if (n !== 0 && n !== Infinity && n !== -Infinity) {
                  n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
              }
              if (n >= len) {
                return -1;
              }
              var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
              for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                  return k;
                }
              }
              return -1;
            };
          }

        };
      }
    };
  }
]);
angular.module('ui.bootstrap.typeahead', ['ui.bootstrap.position'])

	/**
	 * A helper service that can parse typeahead's syntax (string provided by users)
	 * Extracted to a separate service for ease of unit testing
	 */
	  .factory('typeaheadParser', ['$parse', function ($parse) {

	  //                      00000111000000000000022200000000000000003333333333333330000000000044000
	  var TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

	  return {
	    parse:function (input) {

	      var match = input.match(TYPEAHEAD_REGEXP), modelMapper, viewMapper, source;
	      if (!match) {
	        throw new Error(
	          "Expected typeahead specification in form of '_modelValue_ (as _label_)? for _item_ in _collection_'" +
	            " but got '" + input + "'.");
	      }

	      return {
	        itemName:match[3],
	        source:$parse(match[4]),
	        viewMapper:$parse(match[2] || match[1]),
	        modelMapper:$parse(match[1])
	      };
	    }
	  };
	}])

  .directive('typeahead', ['$compile', '$parse', '$q', '$timeout', '$document', '$position', 'typeaheadParser',
    function ($compile, $parse, $q, $timeout, $document, $position, typeaheadParser) {

  var HOT_KEYS = [9, 13, 27, 38, 40];

  return {
    require:'ngModel',
    link:function (originalScope, element, attrs, modelCtrl) {

      //SUPPORTED ATTRIBUTES (OPTIONS)

      //minimal no of characters that needs to be entered before typeahead kicks-in
      var minSearch = originalScope.$eval(attrs.typeaheadMinLength) || 1;

      //minimal wait time after last character typed before typehead kicks-in
      var waitTime = originalScope.$eval(attrs.typeaheadWaitMs) || 0;

      //should it restrict model values to the ones selected from the popup only?
      var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;

      //binding to a variable that indicates if matches are being retrieved asynchronously
      var isLoadingSetter = $parse(attrs.typeaheadLoading).assign || angular.noop;

      //a callback executed when a match is selected
      var onSelectCallback = $parse(attrs.typeaheadOnSelect);

      var inputFormatter = attrs.typeaheadInputFormatter ? $parse(attrs.typeaheadInputFormatter) : undefined;

      //INTERNAL VARIABLES

      //model setter executed upon match selection
      var $setModelValue = $parse(attrs.ngModel).assign;

      //expressions used by typeahead
      var parserResult = typeaheadParser.parse(attrs.typeahead);


      //pop-up element used to display matches
      var popUpEl = angular.element('<typeahead-popup></typeahead-popup>');
      popUpEl.attr({
        matches: 'matches',
        active: 'activeIdx',
        select: 'select(activeIdx)',
        query: 'query',
        position: 'position'
      });
      //custom item template
      if (angular.isDefined(attrs.typeaheadTemplateUrl)) {
        popUpEl.attr('template-url', attrs.typeaheadTemplateUrl);
      }

      //create a child scope for the typeahead directive so we are not polluting original scope
      //with typeahead-specific data (matches, query etc.)
      var scope = originalScope.$new();
      originalScope.$on('$destroy', function(){
        scope.$destroy();
      });

      var resetMatches = function() {
        scope.matches = [];
        scope.activeIdx = -1;
      };

      var getMatchesAsync = function(inputValue) {

        var locals = {$viewValue: inputValue};
        isLoadingSetter(originalScope, true);
        $q.when(parserResult.source(scope, locals)).then(function(matches) {

          //it might happen that several async queries were in progress if a user were typing fast
          //but we are interested only in responses that correspond to the current view value
          if (inputValue === modelCtrl.$viewValue) {
            if (matches.length > 0) {

              scope.activeIdx = 0;
              scope.matches.length = 0;

              //transform labels
              for(var i=0; i<matches.length; i++) {
                locals[parserResult.itemName] = matches[i];
                scope.matches.push({
                  label: parserResult.viewMapper(scope, locals),
                  model: matches[i]
                });
              }

              scope.query = inputValue;
              //position pop-up with matches - we need to re-calculate its position each time we are opening a window
              //with matches as a pop-up might be absolute-positioned and position of an input might have changed on a page
              //due to other elements being rendered
              scope.position = $position.position(element);
              scope.position.top = scope.position.top + element.prop('offsetHeight');

            } else {
              resetMatches();
            }
            isLoadingSetter(originalScope, false);
          }
        }, function(){
          resetMatches();
          isLoadingSetter(originalScope, false);
        });
      };

      resetMatches();

      //we need to propagate user's query so we can higlight matches
      scope.query = undefined;

      //Declare the timeout promise var outside the function scope so that stacked calls can be cancelled later
      var timeoutPromise;

      //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
      //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
      modelCtrl.$parsers.unshift(function (inputValue) {

        resetMatches();
        if (inputValue && inputValue.length >= minSearch) {
          if (waitTime > 0) {
            if (timeoutPromise) {
              $timeout.cancel(timeoutPromise);//cancel previous timeout
            }
            timeoutPromise = $timeout(function () {
              getMatchesAsync(inputValue);
            }, waitTime);
          } else {
            getMatchesAsync(inputValue);
          }
        }

        if (isEditable) {
          return inputValue;
        } else {
          modelCtrl.$setValidity('editable', false);
          return undefined;
        }
      });

      modelCtrl.$formatters.push(function (modelValue) {

        var candidateViewValue, emptyViewValue;
        var locals = {};

        if (inputFormatter) {

          locals['$model'] = modelValue;
          return inputFormatter(originalScope, locals);

        } else {

          //it might happen that we don't have enough info to properly render input value
          //we need to check for this situation and simply return model value if we can't apply custom formatting
          locals[parserResult.itemName] = modelValue;
          candidateViewValue = parserResult.viewMapper(originalScope, locals);
          locals[parserResult.itemName] = undefined;
          emptyViewValue = parserResult.viewMapper(originalScope, locals);

          return candidateViewValue!== emptyViewValue ? candidateViewValue : modelValue;
        }
      });

      scope.select = function (activeIdx) {
        //called from within the $digest() cycle
        var locals = {};
        var model, item;

        locals[parserResult.itemName] = item = scope.matches[activeIdx].model;
        model = parserResult.modelMapper(originalScope, locals);
        $setModelValue(originalScope, model);
        modelCtrl.$setValidity('editable', true);

        onSelectCallback(originalScope, {
          $item: item,
          $model: model,
          $label: parserResult.viewMapper(originalScope, locals)
        });

        resetMatches();

        //return focus to the input element if a mach was selected via a mouse click event
        element[0].focus();
      };

      //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
      element.bind('keydown', function (evt) {

        //typeahead is open and an "interesting" key was pressed
        if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
          return;
        }

        evt.preventDefault();

        if (evt.which === 40) {
          scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
          scope.$digest();

        } else if (evt.which === 38) {
          scope.activeIdx = (scope.activeIdx ? scope.activeIdx : scope.matches.length) - 1;
          scope.$digest();

        } else if (evt.which === 13 || evt.which === 9) {
          scope.$apply(function () {
            scope.select(scope.activeIdx);
          });

        } else if (evt.which === 27) {
          evt.stopPropagation();

          resetMatches();
          scope.$digest();
        }
      });

      $document.bind('click', function(){
        resetMatches();
        scope.$digest();
      });

      element.after($compile(popUpEl)(scope));
    }
  };

	}])

	  .directive('typeaheadPopup', function () {
	    return {
	      restrict:'E',
	      scope:{
	        matches:'=',
	        query:'=',
	        active:'=',
	        position:'=',
	        select:'&'
	      },
	      replace:true,
	      templateUrl:'app/views/bootstrap/typeahead-popup.html',
	      link:function (scope, element, attrs) {

	        scope.templateUrl = attrs.templateUrl;

	        scope.isOpen = function () {
	          return scope.matches.length > 0;
	        };

	        scope.isActive = function (matchIdx) {
	          return scope.active == matchIdx;
	        };

	        scope.selectActive = function (matchIdx) {
	          scope.active = matchIdx;
	        };

	        scope.selectMatch = function (activeIdx) {
	          scope.select({activeIdx:activeIdx});
	        };
	      }
	    };
	  })

	  .directive('typeaheadMatch', ['$http', '$templateCache', '$compile', '$parse', function ($http, $templateCache, $compile, $parse) {
	    return {
	      restrict:'E',
	      scope:{
	        index:'=',
	        match:'=',
	        query:'='
	      },
	      link:function (scope, element, attrs) {
	        var tplUrl = $parse(attrs.templateUrl)(scope.$parent) || 'app/views/bootstrap/typeahead-match.html';
	        $http.get(tplUrl, {cache: $templateCache}).success(function(tplContent){
	           element.replaceWith($compile(tplContent.trim())(scope));
	        });
	      }
	    };
	  }])

	  .filter('typeaheadHighlight', function() {

	    function escapeRegexp(queryToEscape) {
	      return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
	    }

	    return function(matchItem, query) {
	      return query ? matchItem.replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : query;
	    };
	  });

angular.module('ui.bootstrap.collapse',['ui.bootstrap.transition'])

  // The collapsible directive indicates a block of html that will expand and collapse
  .directive('collapse', ['$transition', function($transition) {
    // CSS transitions don't work with height: auto, so we have to manually change the height to a
    // specific value and then once the animation completes, we can reset the height to auto.
    // Unfortunately if you do this while the CSS transitions are specified (i.e. in the CSS class
    // "collapse") then you trigger a change to height 0 in between.
    // The fix is to remove the "collapse" CSS class while changing the height back to auto - phew!
    var fixUpHeight = function(scope, element, height) {
      // We remove the collapse CSS class to prevent a transition when we change to height: auto
      element.removeClass('collapse'); // Turn this on for compatibility with Bootstrap 2
      element.removeClass('in'); // Turn this on for compatibility with Bootstrap 3 RC1
      element.removeClass('collapsing'); // Added for compatibility with Bootstrap 3 RC1
      element.css({ height: height });
      // It appears that  reading offsetWidth makes the browser realise that we have changed the
      // height already :-/
      var x = element[0].offsetWidth;
      element.addClass('collapse'); // Turn this on for compatibility with Bootstrap 2
      element.addClass('in'); // Turn this on for compatibility with Bootstrap 3 RC1
      element.addClass('collapsing'); // Added for compatibility with Bootstrap 3 RC1
    };

    return {
      link: function(scope, element, attrs) {

        var isCollapsed;
        var initialAnimSkip = true;
        scope.$watch(function (){ return element[0].scrollHeight; }, function (value) {
          //The listener is called when scollHeight changes
          //It actually does on 2 scenarios:
          // 1. Parent is set to display none
          // 2. angular bindings inside are resolved
          //When we have a change of scrollHeight we are setting again the correct height if the group is opened
          if (element[0].scrollHeight !== 0) {
            if (!isCollapsed) {
              if (initialAnimSkip) {
                fixUpHeight(scope, element, element[0].scrollHeight + 'px');
              } else {
                fixUpHeight(scope, element, 'auto');
              }
            }
          }
        });

        scope.$watch(attrs.collapse, function(value) {
          if (value) {
            collapse();
          } else {
            expand();
          }
        });


        var currentTransition;
        var doTransition = function(change) {
          if ( currentTransition ) {
            currentTransition.cancel();
          }
          currentTransition = $transition(element,change);
          currentTransition.then(
            function() { currentTransition = undefined; },
            function() { currentTransition = undefined; }
          );
          return currentTransition;
        };

        var expand = function() {
          if (initialAnimSkip) {
            initialAnimSkip = false;
            if ( !isCollapsed ) {
              fixUpHeight(scope, element, 'auto');
            }
          } else {
            doTransition({ height : element[0].scrollHeight + 'px' })
            .then(function() {
              // This check ensures that we don't accidentally update the height if the user has closed
              // the group while the animation was still running
              if ( !isCollapsed ) {
                fixUpHeight(scope, element, 'auto');
              }
            });
          }
          isCollapsed = false;
        };

        var collapse = function() {
          isCollapsed = true;
          if (initialAnimSkip) {
            initialAnimSkip = false;
            fixUpHeight(scope, element, 0);
          } else {
            fixUpHeight(scope, element, element[0].scrollHeight + 'px');
            doTransition({'height':'0'});
          }
        };
      }
    };
  }])
	// The collapsible directive indicates a block of html that will expand and collapse
	.directive('collapse', ['$transition', function($transition) {
	  // CSS transitions don't work with height: auto, so we have to manually change the height to a
	  // specific value and then once the animation completes, we can reset the height to auto.
	  // Unfortunately if you do this while the CSS transitions are specified (i.e. in the CSS class
	  // "collapse") then you trigger a change to height 0 in between.
	  // The fix is to remove the "collapse" CSS class while changing the height back to auto - phew!
	  var fixUpHeight = function(scope, element, height) {
	    // We remove the collapse CSS class to prevent a transition when we change to height: auto
	    element.removeClass('collapse');
	    element.css({ height: height });
	    // It appears that  reading offsetWidth makes the browser realise that we have changed the
	    // height already :-/
	    var x = element[0].offsetWidth;
	    element.addClass('collapse');
	  };

	  return {
	    link: function(scope, element, attrs) {

	      var isCollapsed;
	      var initialAnimSkip = true;
	      scope.$watch(function (){ return element[0].scrollHeight; }, function (value) {
	        //The listener is called when scollHeight changes
	        //It actually does on 2 scenarios:
	        // 1. Parent is set to display none
	        // 2. angular bindings inside are resolved
	        //When we have a change of scrollHeight we are setting again the correct height if the group is opened
	        if (element[0].scrollHeight !== 0) {
	          if (!isCollapsed) {
	            if (initialAnimSkip) {
	              fixUpHeight(scope, element, element[0].scrollHeight + 'px');
	            } else {
	              fixUpHeight(scope, element, 'auto');
	            }
	          }
	        }
	      });

	      scope.$watch(attrs.collapse, function(value) {
	        if (value) {
	          collapse();
	        } else {
	          expand();
	        }
	      });


	      var currentTransition;
	      var doTransition = function(change) {
	        if ( currentTransition ) {
	          currentTransition.cancel();
	        }
	        currentTransition = $transition(element,change);
	        currentTransition.then(
	          function() { currentTransition = undefined; },
	          function() { currentTransition = undefined; }
	        );
	        return currentTransition;
	      };

	      var expand = function() {
	      	console.log('element,element[0].scrollHeight',element,element[0].scrollHeight);
	        if (initialAnimSkip) {
	          initialAnimSkip = false;
	          if ( !isCollapsed ) {
	            fixUpHeight(scope, element, 'auto');
	          }
	        } else {
	          doTransition({ height : element[0].scrollHeight + 'px' })
	          .then(function() {
	            // This check ensures that we don't accidentally update the height if the user has closed
	            // the group while the animation was still running
	            if ( !isCollapsed ) {
	              fixUpHeight(scope, element, 'auto');
	            }
	          });
	        }
	        isCollapsed = false;
	      };

	      var collapse = function() {
	        isCollapsed = true;
	        if (initialAnimSkip) {
	          initialAnimSkip = false;
	          fixUpHeight(scope, element, 0);
	        } else {

	          fixUpHeight(scope, element, element[0].scrollHeight + 'px');
	          doTransition({'height':'0'});
	        }
	      };
	    }
	  };
	}]);

angular.module('ui.bootstrap.position', [])

  /**
   * A set of utility methods that can be use to retrieve position of DOM elements.
   * It is meant to be used where we need to absolute-position DOM elements in
   * relation to other, existing elements (this is the case for tooltips, popovers,
   * typeahead suggestions etc.).
   */
    .factory('$position', ['$document', '$window', function ($document, $window) {

      function getStyle(el, cssprop) {
        if (el.currentStyle) { //IE
          return el.currentStyle[cssprop];
        } else if ($window.getComputedStyle) {
          return $window.getComputedStyle(el)[cssprop];
        }
        // finally try and get inline style
        return el.style[cssprop];
      }

      /**
       * Checks if a given element is statically positioned
       * @param element - raw DOM element
       */
      function isStaticPositioned(element) {
        return (getStyle(element, "position") || 'static' ) === 'static';
      }

      /**
       * returns the closest, non-statically positioned parentOffset of a given element
       * @param element
       */
      var parentOffsetEl = function (element) {
        var docDomEl = $document[0];
        var offsetParent = element.offsetParent || docDomEl;
        while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
          offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || docDomEl;
      };

      return {
        /**
         * Provides read-only equivalent of jQuery's position function:
         * http://api.jquery.com/position/
         */
        position: function (element) {
          var elBCR = this.offset(element);
          var offsetParentBCR = { top: 0, left: 0 };
          var offsetParentEl = parentOffsetEl(element[0]);
          if (offsetParentEl != $document[0]) {
            offsetParentBCR = this.offset(angular.element(offsetParentEl));
            offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
            offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
          }

          return {
            width: element.prop('offsetWidth'),
            height: element.prop('offsetHeight'),
            top: elBCR.top - offsetParentBCR.top,
            left: elBCR.left - offsetParentBCR.left
          };
        },

        /**
         * Provides read-only equivalent of jQuery's offset function:
         * http://api.jquery.com/offset/
         */
        offset: function (element) {
          var boundingClientRect = element[0].getBoundingClientRect();
          return {
            width: element.prop('offsetWidth'),
            height: element.prop('offsetHeight'),
            top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop),
            left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft)
          };
        }
      };
    }]);

angular.module('ui.bootstrap.transition', [])

  /**
   * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
   * @param  {DOMElement} element  The DOMElement that will be animated.
   * @param  {string|object|function} trigger  The thing that will cause the transition to start:
   *   - As a string, it represents the css class to be added to the element.
   *   - As an object, it represents a hash of style attributes to be applied to the element.
   *   - As a function, it represents a function to be called that will cause the transition to occur.
   * @return {Promise}  A promise that is resolved when the transition finishes.
   */
  .factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {

    var $transition = function(element, trigger, options) {
      options = options || {};
      var deferred = $q.defer();
      var endEventName = $transition[options.animation ? "animationEndEventName" : "transitionEndEventName"];

      var transitionEndHandler = function(event) {
        $rootScope.$apply(function() {
          element.unbind(endEventName, transitionEndHandler);
          deferred.resolve(element);
        });
      };

      if (endEventName) {
        element.bind(endEventName, transitionEndHandler);
      }

      // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
      $timeout(function() {
        if ( angular.isString(trigger) ) {
          element.addClass(trigger);
        } else if ( angular.isFunction(trigger) ) {
          trigger(element);
        } else if ( angular.isObject(trigger) ) {
          element.css(trigger);
        }
        //If browser does not support transitions, instantly resolve
        if ( !endEventName ) {
          deferred.resolve(element);
        }
      });

      // Add our custom cancel function to the promise that is returned
      // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
      // i.e. it will therefore never raise a transitionEnd event for that transition
      deferred.promise.cancel = function() {
        if ( endEventName ) {
          element.unbind(endEventName, transitionEndHandler);
        }
        deferred.reject('Transition cancelled');
      };

      return deferred.promise;
    };

    // Work out the name of the transitionEnd event
    var transElement = document.createElement('trans');
    var transitionEndEventNames = {
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'transition': 'transitionend'
    };
    var animationEndEventNames = {
      'WebkitTransition': 'webkitAnimationEnd',
      'MozTransition': 'animationend',
      'OTransition': 'oAnimationEnd',
      'transition': 'animationend'
    };
    function findEndEventName(endEventNames) {
      for (var name in endEventNames){
        if (transElement.style[name] !== undefined) {
          return endEventNames[name];
        }
      }
    }
    $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
    $transition.animationEndEventName = findEndEventName(animationEndEventNames);
    return $transition;
  }]);
