export function configure(config) {
  config.globalResources([
    PLATFORM.moduleName('./editable-form/editable-form'),
    // Add Custom Attributes
    PLATFORM.moduleName('./custom-attributes/select')
  ]);
}
