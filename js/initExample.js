function initJS(){

  // BOOTSTRAP ELEMENT INIZIALIZATION
  //Initialize bootstrap tooltips
  $('[data-toggle="tooltip"]').tooltip();

  //Initialize popovers tooltips
  $('[data-toggle="popover"]').popover();

  // Initialize expandable panels
  $(".expandable-panel").click(function(){

    $('.expandable').toggle('slow', function() {
        $('.expandable').toggleClass('hidden');
      });
  });

  //Initialize bootstrap switches
  $("[name='my-checkbox']").bootstrapSwitch('state', false, false);

  // END OF BOOTSTRAP ELEMENT INIZIALIZATION

}

initJS();
