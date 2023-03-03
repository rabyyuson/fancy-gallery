/*!
 *
 * Fancy Gallery v1.0.581
 * Raby Yuson (http://www.rabyyuson.com)
 * License: http://www.opensource.org/licenses/mit-license.php
 * 
 */

(function($){
    
    var methods = {
					
        init : function(options){
	    
            /*
             * Initialize the main global controls
             * Customizable and overridable options 
             */
            var settings = $.extend({
                    'previewFadeInTime' : 2200,
                    'imagePreviewSize' : 960,
                    'effect' : 'fade'
                },options),
                container = this,
                thumbs = this.find('.gallery-icon img'),
                dl = $('.gallery dl'),
                dd = $('.wp-caption-text, .gallery-caption'),
                totThumbs = this.find('.gallery-icon img').length,
                statThumb = totThumbs,
                leftovers = 0,
                slideImg = 0,
                capOn = 0,
                navClicked = null,
                currThumbIndex = 0;
            
            globals.previewFadeInTime = settings.previewFadeInTime;
            globals.imagePreviewSize = settings.imagePreviewSize;
            globals.effect = settings.effect;
            globals.totThumbs = totThumbs;
            globals.statThumb = statThumb;
            globals.leftovers = leftovers;
            globals.slideImg = slideImg;
            globals.capOn = capOn;
            globals.navClicked = navClicked;
            globals.currThumbIndex = currThumbIndex;
            
            if($('.gallery').length>0){
                $('.gallery').each(function(){
                    if($(this).attr('id') != 'gallery-1'){
                        $(this).remove();
                    }
                })
            }
            
            /*
             * Wrap the gallery element in a container
             * Create the preview pane where the large image would show up
             * Also create the navigation control buttons (previous and next)
             */            
            container.wrap('<div id="gallery-wrapper-inner"/>');
            $('#gallery-wrapper-inner').wrap('<div id="gallery-wrapper-outer"/>');
            $('#gallery-wrapper-inner').wrap('<div id="gallery-container"/>');
            $('#gallery-wrapper-outer').prepend($('<span/>').attr('id','showMoreLeft'));
            $('#gallery-wrapper-outer').append($('<span/>').attr('id','showMoreRight'));
            $('#gallery-wrapper-outer').before($('<div/>').attr('id','preview'));
            $('#preview').prepend(
                $('<span/>').attr({ 'id':'captionContainer' }).css({ 'width':(settings['imagePreviewSize']-40)+'px' }).append(
                    $('<span/>').attr({ 'id':'infoCap' }).css({
                        'position':'absolute',
                        'left':0,
                        'bottom':'1px'
                    })
                )
            )
			$('#infoCap').after(
				$('<span/>').attr({ 'id':'titleContainer' }).css({
					'position':'absolute',
					'left':0,
					'bottom':0,
					'width':(settings['imagePreviewSize']-40)+'px'
				})
			)
            $('#preview').append(
                $('<span/>').attr({'id':'leftArr','class':'navBtn'})
            ).after(
                $('<div/>').attr({ 'id':'botShadow' })
            )
			$('#leftArr').after($('<span/>').attr({'id':'rightArr','class':'navBtn'}))
                
            /*
             * Check for orphan dt nodes
             * If it exist, wrap it inside a dl element for consistency
             * Prevents the functionality from breaking
             */
            thumbs.each(function(){
                if($(this).parents('.gallery-item').length==0){
                    var orphanNode = $(this).parents('.gallery-icon');
                    orphanNode.wrap('<dl class="gallery-item"/>')
                }
            })
            
            /*
             * Remove dl element without the class attributes
             * This is a check for non-orphan dl tags
             */
            dl.each(function(){
                if($(this).attr('class')!='gallery-item'){
                    $(this).remove();
                }
                if($(this).find('.wp-caption-text,.gallery-caption').length>0){
                    $(this).find('.wp-caption-text,.gallery-caption').remove();
                }
            })
            
            /*
             * Remove dd element (.wp-caption-text, .gallery-caption)
             * Breaks the thumbnail list so we need to delete
             */
            dd.each(function(){
                $(this).remove();
            })
            
            /*
             * Display the first thumbnail's large image from the list
             * Do an ajax request to pull the image from the parent anchor node
             */
            if($('#preview img').length==0){
				var largeImg = $('#preview').prepend($('<img/>').attr('src',thumbs.eq(0).parent().attr('href')).css({'width':'940px','height':'600px'})),
				title = thumbs.eq(0).parent().attr('title'),
				caption = thumbs.eq(0).attr('alt')
				
				$('#preview').prepend(largeImg);
				
				$('#titleContainer').html("<span class='capDismiss' onclick='capDismiss()'></span><span class='title'>"+title+"</span>"+(caption.length>0 ? " &#8211; " : "")+"<span class='caption'>"+caption+"</span>").css({
					'display':'block'					
				})
				$('#titleContainer').css({'bottom':'-'+(document.getElementById('titleContainer').scrollHeight)+'px'})
				
				imgResizer(settings['imagePreviewSize'],largeImg)
				
				transitionImage($('#preview img'),'fade',settings['previewFadeTime']);
				
				$('#botShadow').fadeIn(settings['previewFadeTime']);
				thumbs.eq(0).parent().before($('<span/>').attr('class','overlay'));
				thumbs.eq(0).css({'border':'2px solid #000'})
				selected = thumbs.eq(0);
				globals.currThumbIndex = $('dl').index(selected.parents('dl'))/13;
            }
                        
            /*
             * Thumbnails onclick event handler
             * Cancel the link url redirect then pull the large image for display
             */
            thumbs.click(function(e){
                e.preventDefault();
                selected = $(this);
                var currThumbIndex = ($('dl').index($(this).parents('dl'))/13);
                if(globals.currThumbIndex > currThumbIndex){
                    globals.navClicked = 'prev';
                }else if(globals.currThumbIndex < currThumbIndex){
                    globals.navClicked = 'next';
                }
                globals.currThumbIndex = currThumbIndex;
                getImage(selected,thumbs,settings['effect'],settings['imagePreviewSize'],settings['previewFadeTime']);
                return false;
            })
            
            /*
             * Navigation control buttons onclick event handler
             * Retrieve the previous/next parent node then cycle through the image
             */
            $('#preview .navBtn').click(function(){
                var parent = null;
                if ($(this).attr('id') == 'leftArr') {
                   globals.navClicked = 'prev';
                   parent = selected.parents('.gallery-item').prev();
                   cycleImage(parent,'prev');
                }else if ($(this).attr('id') == 'rightArr') {
                   globals.navClicked = 'next';
                   parent = selected.parents('.gallery-item').next();
                   cycleImage(parent,'next');
                }
            })
            
            /*
             * Left/Right arrow key onkeypress event handler
             * Same functionality as the navigation control buttons event handler 
             * Left = Previous / Right = Next
             */
            $(document).keydown(function(e){
                var parent = null;
                if (e.keyCode == 37) { 
                   globals.navClicked = 'prev';
                   parent = selected.parents('.gallery-item').prev();
                   cycleImage(parent,'prev');
                }else if (e.keyCode == 39) { 
                   globals.navClicked = 'next';
                   parent = selected.parents('.gallery-item').next();
                   cycleImage(parent,'next');
                }
            })
            
            /*
             * Search for the selected thumbnail for previous and next base reference
             * Get the large image once complete
             */
            function cycleImage(parent,base){

                if(parent.find('img').length>0){
                    selected = parent.find('img');
                    getImage(selected,thumbs,settings['effect'],settings['imagePreviewSize'],settings['previewFadeTime']);
                    var operate = (($('dl').index(parent))/13);
                    
                    globals.currThumbIndex = operate;
                    
                    if(operate == parseInt(operate) && base == 'next'){
                        
                        globals.navClicked = 'next';
                        globals.totThumbs -= 13;
                        
                        if(globals.totThumbs>0){
                            
                            globals.slideImg += 13;
                            $('#gallery-wrapper-inner').animate({
                            'left':'-=910px'
                            },600,'easeInOutQuart')
                            if(globals.totThumbs<13){
                                globals.leftovers = globals.totThumbs;
                                globals.totThumbs = globals.leftovers;
                            }
                            
                        }else{
                            globals.totThumbs = globals.leftovers;
                        }
                        
                    }else if(String(operate).charAt(2)=='9' && base == 'prev'){
                        
                        if(globals.totThumbs < globals.statThumb){
                            
                            globals.navClicked = 'prev';
                            globals.slideImg -= 13;

                            $('#gallery-wrapper-inner').animate({
                            'left':'+=910px'
                            },600,'easeInOutQuart')
                            globals.totThumbs += 13;
                        }
                        
                    }
                }
            }
            
            /*
             * FadeIn / FadeOut navigation button effect on Preview hover
             */
            $('#preview').hover(function(){
                $('#leftArr, #rightArr, #infoCap').fadeIn(settings['previewFadeTime']);
            },function(){
                $('#leftArr, #rightArr, #infoCap').fadeOut(settings['previewFadeTime']);
            })
            
            /*
             * Info Caption button click event
             * Slide the Caption Container up/down
             */
            $('#infoCap').click(function(){
               $(this).animate({
                   'bottom':'-=32px'
               },200,'easeInOutCirc',function(){
                   $('#titleContainer').animate({
                       'bottom':'+='+(document.getElementById('titleContainer').scrollHeight)+'px'
                   },200,'easeOutExpo',function(){
                       globals.capOn = 1;
                   })
               });
            })
            
            
	},
        
        showMore : function(){
            /*
             * Check if the thumbnail count is greater than 13 (maximum items to display in one set)
             * If true - create the slider to show more images
             */
            if($(this).find('.gallery-icon img').length>13){
                $('#showMoreRight, #showMoreLeft').fadeIn(300);
                $('#showMoreRight').click(function(){
                    if((globals.totThumbs - 13) != 0){
                        globals.totThumbs -= 13;
                        if(globals.totThumbs>0){
                            globals.slideImg += 13;
                            $('.gallery-icon img').eq(13).parent().before($('<span/>').attr('class','overlay'));
                            $('.gallery-icon img').eq(13).css({'border':'2px solid #000'})
                            getImage($('.gallery-icon img').eq(globals.slideImg),$('.gallery-icon img'),globals.effect,globals.imagePreviewSize,globals.previewFadeTime);
                            selected = $('.gallery-icon img').eq(globals.slideImg);

                            $('#gallery-wrapper-inner').animate({
                            'left':'-=910px'
                            },400,'easeOutExpo')

                            if(globals.totThumbs<13){
                                globals.leftovers = globals.totThumbs;
                            }
                            var currThumbIndex = ($('dl').index(selected.parents('dl'))/13);
                            globals.currThumbIndex = currThumbIndex;
                            globals.navClicked = 'next';
                        }else{
                            globals.totThumbs = globals.leftovers;
                        }
                    }
                })
                $('#showMoreLeft').click(function(){
                    if(globals.totThumbs < globals.statThumb){
                        globals.slideImg -= 13;
                        $('.gallery-icon img').eq(13).parent().before($('<span/>').attr('class','overlay'));
                        $('.gallery-icon img').eq(13).css({'border':'2px solid #000'})
                        getImage($('.gallery-icon img').eq(globals.slideImg),$('.gallery-icon img'),globals.effect,globals.imagePreviewSize,globals.previewFadeTime);
                        selected = $('.gallery-icon img').eq(globals.slideImg);
                        $('#gallery-wrapper-inner').animate({
                        'left':'+=910px'
                        },400,'easeOutExpo')
                        globals.totThumbs += 13;
                        var currThumbIndex = ($('dl').index(selected.parents('dl'))/13);
                        globals.currThumbIndex = currThumbIndex;
                        globals.navClicked = 'prev';
                    }
                })  
                    
            }
        }
    }
  			
    $.fn.fancyGallery = function(method){
  				  								
            if(methods[method]){
                return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 )); 					
            } else if ( typeof method === 'object' || ! method ) {
                return methods.init.apply( this, arguments );
            } else {
                $.error( 'Method ' +  method + ' does not exist!' );
            }    
  				
    }
			
})(jQuery);

var globals = {
    'previewFadeInTime' : null,
    'imagePreviewSize' : null,
    'effect' : null
    }, 
    selected = null,
    totThumbs = 0,
    statThumb = totThumbs,
    leftovers = 0,
    slideImg = 0,
    capOn = 0,
    navClicked = null,
    currThumbIndex = 0;

/*
 * Do an ajax request to pull the image retrievable from the parent anchor node
 * Show the overlay on the selected thumbnail
 */

function getImage(selected,thumbs,effect,imagePreviewSize,previewFadeTime){
    selected.parent().attr('href')
	thumbs.css({'border':'2px solid #fff'})
	selected.css({'border':'2px solid #000'})
	if($('.gallery .overlay').length>0){
		$('.gallery .overlay').remove();
	}
	selected.parent().before($('<span/>').attr('class','overlay'));
	success(selected,effect,imagePreviewSize,previewFadeTime);
}
                       
/*
 * Retrieve the large image from the anchor node
 * Always remove any image in the preview pane before prepending
 */
function success(selected,effect,imagePreviewSize,previewFadeTime){
    var largeImg = $('<img/>').attr('src',selected.parent().attr('href')).css({'width':'940px','height':'600px'}),
	title = selected.parent().attr('title'),
	caption = selected.attr('alt')
    
    if($('#preview img').length>0){
        $('#preview img').css({
            'position':'absolute',
            'left':0,
            'top':0
        })
        if(effect == 'none'){
            $('#preview img').hide();
            $('#preview img').remove();
        }else if(effect == 'fade'){
            $('#preview img').fadeOut(previewFadeTime,function(){
                $(this).remove();
            });
        }else if(effect == 'slide'){
            if(globals.navClicked == 'prev'){
                $('#preview img').animate({
                    'left':'+=1000px'
                },800,'easeOutExpo',function(){
                    $(this).remove();
                });
                $('#preview img').fadeOut(800);
            }else if(globals.navClicked == 'next'){
                $('#preview img').animate({
                    'left':'-=1000px'
                },800,'easeOutExpo',function(){
                    $(this).remove();
                });
                $('#preview img').fadeOut(800);
            }
        }
    }

    if(globals.capOn == 0){
        $('#titleContainer').html("<span class='capDismiss' onclick='capDismiss()'></span><span class='title'>"+title+"</span>"+(caption.length>0 ? " &#8211; " : "")+"<span class='caption'>"+caption+"</span>").css({
            'bottom':'-'+(document.getElementById('titleContainer').scrollHeight)+'px',
            'display':'block'
        });
    }else if(globals.capOn == 1){
        $('#titleContainer').html("<span class='capDismiss' onclick='capDismiss()'></span><span class='title'>"+title+"</span> "+(caption.length>0 ? "&#8211;" : "")+" <span class='caption'>"+caption+"</span>")
    }
    
    $('#preview').prepend(largeImg);
    //imgResizer(imagePreviewSize,largeImg)

    transitionImage($('#preview img'),effect,previewFadeTime);                
}           

/*
 * Set the position of the navigation controls relative to the parent node
 * Also do the transition effect selected
 */
function transitionImage(parent,effect,previewFadeTime){

    var parentHeight = parent.height();
    $('#leftArr').css({
        'top':(parentHeight/2)-40,
        'left':'10px'
    })
    $('#rightArr').css({
        'top':(parentHeight/2)-40,
        'right':'10px'
    })


    if(effect == 'none'){
        $('#preview img').show();
    }else if(effect == 'fade' || effect == 'slide'){
        $('#preview img').fadeIn(previewFadeTime)
    }
    
    $('#preview').css({
            'height':$('#preview img').height()+10
        })
    
    $('#preview img').css({
            'position':'absolute',
            'left':0,
            'top':0
        })

}

/*
 * Caption Dismiss button click event
 */
function capDismiss(){
    $('#titleContainer').animate({
        'bottom':'-='+(document.getElementById('titleContainer').scrollHeight)+'px'
    },200,'easeInOutCirc',function(){
        $('#infoCap').animate({
            'bottom':'+=32px'
        },200,'easeInOutCirc',function(){
            globals.capOn = 0;
        })
    })
}