export const themes = {
  'default': {
    formTpl: '<form class="editable-wrap"></form>',
    noformTpl: '<span class="editable-wrap"></span>',
    controlsTpl: '<span class="editable-controls"></span>',
    inputTpl: '',
    errorTpl: '<div class="editable-error" data-ng-if="$error" data-ng-bind-html="$error"></div>',
    buttonsTpl: '<span class="editable-buttons"></span>',
    submitTpl: '<button type="submit">save</button>',
    cancelTpl: '<button type="button" ng-click="$form.$cancel()">cancel</button>',
    resetTpl: '<button type="reset">clear</button>'
  },
  'bs3': {
    formTpl: '<form class="form-inline editable-wrap" role="form"></form>',
    noformTpl: '<span class="editable-wrap"></span>',
    controlsTpl: '<div class="editable-controls form-group" ng-class="{\'has-error\': $error}"></div>',
    inputTpl: '',
    errorTpl: '<div class="editable-error help-block" data-ng-if="$error" data-ng-bind-html="$error"></div>',
    buttonsTpl: '<span class="editable-buttons"></span>',
    submitTpl: '<button type="submit" class="btn btn-primary"><span></span></button>',
    cancelTpl: `
      <button type="button" class="btn btn-default"
        ng-click="$form.$cancel()">
        <span></span>
      </button>`,
    resetTpl: '<button type="reset" class="btn btn-danger">clear</button>',

    //bs3 specific prop to change buttons class: btn-sm, btn-lg
    buttonsClass: '',
    //bs3 specific prop to change standard inputs class: input-sm, input-lg
    inputClass: '',
    postrender: function() {
      //apply `form-control` class to std inputs
      const customElementName = Object.keys(this.element.au).pop();
      switch (customElementName) {
      case 'editable-select':
        this.inputEl.addClass('form-control');
        if (this.theme.inputClass) {
          // don`t apply `input-sm` and `input-lg` to select multiple
          // should be fixed in bs itself!
          if (this.inputEl.attr('multiple') &&
            (this.theme.inputClass === 'input-sm' ||
              this.theme.inputClass === 'input-lg')) {
            break;
          }
          this.inputEl.addClass(this.theme.inputClass);
        }
        break;
      case 'editableCheckbox':
        this.editorEl.addClass('checkbox');
        break;
      default:
        console.log('Do something');
      }

      //apply buttonsClass (bs3 specific!)
      if (this.buttonsEl && this.theme.buttonsClass) {
        this.buttonsEl.find('button').addClass(this.theme.buttonsClass);
      }
    }
  }
};
