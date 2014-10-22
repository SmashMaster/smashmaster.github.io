$(function(){
(function($) {
  //Hide all panels
  var allPanels = $('.accordion > dd').hide();
  //Show first panel
  $('.accordion > dd:first-of-type').show();
  //Add active class to first panel 
  $('.accordion > dt:first-of-type').addClass('accordion-active');
  //Handle click function
  jQuery('.accordion > dt').on('click', function() {
      //this clicked panel
      $this = $(this);
      //the target panel content
      $target = $this.next(); 
	
      //Only toggle non-displayed 
      if(!$this.hasClass('accordion-active')){
          //slide up any open panels and remove active class
          $this.parent().children('dd').slideUp();
          
          //remove any active class
          $this.parent().children('dt').removeClass('accordion-active');
          //add active class
          $this.addClass('accordion-active');
          //slide down target panel
          $target.addClass('active').slideDown();

      }
	
    
    return false;
  });
})(jQuery);
});
