import * as $ from 'jquery';
import * as _ from 'lodash';

import { customAttribute, inject, bindable, TaskQueue }
  from 'aurelia-framework';

import { themes as THEMES } from '../themes';
import { editableDefaults } from '../constants';
import { icons as editableIcons } from '../icons';

import '../css/xeditable.css';

@customAttribute('editable-select')
@inject(Element, TaskQueue)
export class EditableSelectCustomAttribute {
  @bindable value;
  @bindable options;
  @bindable editableTheme;
  @bindable buttons;
  @bindable blur;

  @bindable onShow;
  @bindable onHide;
  @bindable onCancel;
  @bindable onBeforeSave;
  @bindable onAfterSave;
  @bindable onAutoSubmit;

  inputEl = null;
  editorEl = null;
  mouseupListener;
  focusListener;
  isShown = false;
  // user for keep information about an element wrapped within a form element.
  single = true;

  //to be overwritten by directive
  inputTpl = '<select></select>';

  theme = null;
  buttons = 'right';
  popover = false;

  constructor(element, taskQueue) {
    this.element = element;
    this.taskQueue = taskQueue;
    this.$element = $(element);
    this.mouseupListener = (e) => this.handleMouseUp(e);
    this.focusListener = (e) => this.handleFocus(e);
    this.outsideClickListener = (e) => this.handleOutsideClick(e);
  }

  bind(bindingContext) {
    this.themeName = this.editableTheme || editableDefaults.theme || 'default';
    this.theme =  THEMES[this.editableTheme] ||
      THEMES[editableDefaults.theme] || THEMES.default;
    let iconSetOption = editableDefaults.iconSet;
    this.iconSet = iconSetOption === 'default' ?
      editableIcons.default[this.themeName] :
        editableIcons.external[iconSetOption];

    // TODO: add the functionality to detect an existing parent form element
    // if the parent form exists the this.single should be false.

    // settings for single and non-single
    if (!this.single) {
      // hide buttons for non-single
      this.buttons = 'no';
    } else {
      this.buttons = this.buttons || editableDefaults.buttons;
    }
  }

  attached() {
    if (this.isInputElement()) {
      this.element.addEventListener('focus', this.focusListener);
      this.element.addEventListener('blur', this.focusListener);
    } else {
      this.element.addEventListener('click', this.mouseupListener);
    }
  }

  detached() {
    if (this.isInputElement) {
      this.element.removeEventListener('focus', this.focusListener);
      this.element.removeEventListener('blur', this.focusListener);
    } else {
      this.element.removeEventListner('click', this.mouseupListener);
    }
    document.removeEventListener('mouseup', this.mouseupListener);
  }

  isInputElement() {
    return this.element.nodeType === 1 &&
      this.element.tagName.toLowerCase() === 'input';
  }

  inElement(e) {
    let containerRect = this.element.getBoundingClientRect();
    let elementRect = this.element.getBoundingClientRect();
    let inContainerRect = e.clientX > containerRect.left &&
      e.clientX < containerRect.right && e.clientY > containerRect.top &&
        e.clientY < containerRect.bottom;
    let inElementRect = e.clientX > elementRect.left &&
      e.clientX < elementRect.right && e.clientY > elementRect.top &&
        e.clientY < elementRect.bottom;
    return inContainerRect && inElementRect;
  }

  handleMouseUp(e) {
    e.stopImmediatePropagation();
    if (!this.isInputElement() && !this.isShown) {
      this.show();
    } else if (this.isShown && !this.inElement(e)) {
      this.hide();
    }
  }

  handleFocus(e) {
    if (e.type === 'focus' && !this.isShown) {
      this.show();
    }
    if (e.type === 'blur') {
      if (this.isInputElement() && this.element.value !== this.value &&
        typeof this.value !== undefined) {
        this.element.value = this.value;
      }
    }
  }

  render() {
    let theme = this.theme;

    //build input
    this.inputEl = this.buildInputElement(this.inputTpl);

    //build controls
    this.controlsEl = $(theme.controlsTpl);
    this.controlsEl.append(this.inputEl);

    //build buttons
    if (this.buttons !== 'no') {
      this.buttonsEl = $(theme.buttonsTpl);
      this.submitEl = $(theme.submitTpl);
      this.resetEl = $(theme.resetTpl);
      this.cancelEl = $(theme.cancelTpl);
      this.submitEl.attr('title', editableDefaults.submitButtonTitle);
      this.submitEl.attr('aria-label', editableDefaults.submitButtonAriaLabel);
      this.cancelEl.attr('title', editableDefaults.cancelButtonTitle);
      this.cancelEl.attr('aria-label', editableDefaults.cancelButtonAriaLabel);
      this.resetEl.attr('title', editableDefaults.clearButtonTitle);
      this.resetEl.attr('aria-label', editableDefaults.clearButtonAriaLabel);

      if (this.iconSet) {
        this.submitEl.find('span').addClass(this.iconSet.ok);
        this.cancelEl.find('span').addClass(this.iconSet.cancel);
        this.resetEl.find('span').addClass(this.iconSet.clear);
      }

      this.buttonsEl.append(this.submitEl).append(this.cancelEl);

      if (editableDefaults.displayClearButton) {
        this.buttonsEl.append(this.resetEl);
      }

      this.controlsEl.append(this.buttonsEl);
      this.inputEl.addClass('editable-has-buttons');
    }

    //build error
    this.errorEl = theme.errorTpl;
    this.controlsEl.append(this.errorEl);

    //build editor
    this.editorEl = $(this.single ? theme.formTpl : theme.noformTpl);
    this.editorEl.append(this.controlsEl);

    this.inputEl.addClass('editable-input');

    if (this.single) {
      this.editorEl.attr('editable-form', '$form');
      // transfer `blur` to form
      this.editorEl.attr('blur', this.blur || editableDefaults.blurElem);
    }

    // The very specific render per element should start here:
    //

    // TODO: add the post render here or in a TaskQueue
    //apply `postrender` method of theme
    if (_.isFunction(this.theme.postrender)) {
      this.theme.postrender.call(this);
    }
  }

  show() {
    this.render();

    // insert into DOM
    this.$element.after(this.editorEl);

    // // compile (needed to attach ng-* events from markup)
    // newScope = $scope.$new();
    // $compile(this.editorEl)(newScope);

    // attach listeners (`escape`, autosubmit, etc)
    this.addListeners();

    // hide element
    this.$element.addClass('editable-hide');

    this.isShown = true;
    // onshow
    // return this.onshow();
  }

  hide() {
    this.controlsEl.remove();
    this.editorEl.remove();
    this.$element.removeClass('editable-hide');

    this.isShown = false;
    // onhide
    // return this.onhide();
  }

  /*
    Called after show to attach listeners
    */
  addListeners() {
    // bind keyup for `escape`
    this.inputEl.bind('keyup', (e) => {
      console.log('keyup!!!!!');
      if (!this.single) {
        return;
      }

      // todo: move this to editable-form!
      switch (e.keyCode) {
      // hide on `escape` press
      case 27:
        console.log('Esc pressed!!!!');
        this.onCancel();
        // this.$form.$cancel();
        break;
      default:
      }
    });

    // autosubmit when `no buttons`
    if (this.single && this.buttons === 'no') {
      this.autosubmit();
    }

    // click - mark element as clicked to exclude in document click handler
    this.editorEl.bind('click', function(e) {
      // ignore right/middle button click
      if (e.which && e.which !== 1) {
        return;
      }

      if (this.$form.$visible) {
        this.$form._clicked = true;
      }
    });

    document.addEventListener('click', this.outsideClickListener);
    // document.addEventListener('click', onSomething);
  }

  handleOutsideClick(event) {
    console.log(event);
    if (!$(event.target).closest(this.editorEl).length) {
      if (this.isShown) {
        this.hide();
        this.removeClickListener();
      }
    }
  }

  removeClickListener() {
    document.removeEventListener('click', this.outsideClickListener);
  }

  buildInputElement(inputTpl) {
    let el = $(inputTpl);
    if (el[0].tagName === 'SELECT' && Array.isArray(this.options)) {
      this.options.forEach((d) => {
        el.append($('<option>', { value: d.value, text: d.text }));
      });
    }
    return el;
  }

  autosubmit() {
    this.inputEl.bind('change', (event) => {
      //submit.delegate="save()" reset.delegate="cancel()"
      this.form.submit();
    });
  }
}

// createForm() {
//   this.viewEngine.loadViewFactory('../templates/form.html').then(factory => {
//     const childContainer = this.container.createChild();
//     const view = factory.create(childContainer);

//     view.bind(this);

//     this.createElement(view)
//     this.setPosition()

//     if (this.isInputElement)
//       document.addEventListener('mouseup', this.mouseupListener);

//     this.show = true;
//   })

// }
