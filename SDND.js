/*
 * Simple DragNDrop
 * Author: Toufiqur Chowdhury
 * Released under MIT license
 */
/*
    todo: note all css changes while dragging and revert to original state if revert = true
*/

//define object
function SDND(el) {   
    this.el = el;//draggable element jQuery selector
    this.currentEl = null; //
    this.currentElOriginal = null;
    this.currentElOriginalStyleAttr = null;//position, top , left, z-index....
    this.isDragging = false;
    this.droppableEl = ''; //jQuery object or selector
    this.dropOptions = {
        'handlerEl'   : '', //ToDo
        'indicator' : 'Drop here...' //text or jQuery object
    };
    
    //default options
    this.options = {
        'moveOriginal'      :   true,
        'revert'            :   false,  // if moveOriginal = false ??
        'cloneEvents'       :   true,   // whether to preserve events when cloning element << if moveOriginal = false
        'elHandler'         :   '',     // jQuery selector that will control/initiate drag
        'elOverlay'         :   '',     // jQuery selector or object accepted
        'fixedPosition'     :   false   // false > position:absolute, true > position:fixed
    };
    
    this.callbacks = {
        dragStart       :   function(event) { },
        dragging        :   function(event) { },
        dragEnd         :   function(event) { },
        dropEnter       :   function(event, $droppableEl) { console.log('callback: dropEnter'); },
        dropLeave       :   function(event, $droppableEl) { console.log('callback: dropLeave');  },
        dropCancel      :   function(event, $droppableEl) { console.log('callback: dropCancel'); },
        dropped         :   function(event, $droppableEl) { console.log('callback: dropped'); }
    };

};




function Rectangle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.xRight = this.x + width;
    this.yBottom = this.y + height;
}
function pointOverRectangle(rect, X, Y) {
        return ( (rect.x <= X && X <= rect.xRight)  
                && (rect.y <= Y && Y <= rect.yBottom) )
                ? true : false;
}

//call only once
SDND.prototype.init = function(){
    var obj     = this;
    var el      = obj.el;
    var options = obj.options;
    var callbacks = obj.callbacks;
    var elHandler = (options.elHandler === '' ? el : options.elHandler);
    var moveOriginal = options.moveOriginal;
    var revert = options.revert;
    var cloneEvents = options.cloneEvents;
    var $elOverlay = $(options.elOverlay).clone(true);
    var position = (options.fixedPosition ? 'fixed' : 'absolute');
    
    
    
    //droppable
    var $droppableEl, isDroppable = false, droppables = [];

    
    var xOffset = 0
    var yOffset = 0;
    var isDragging = obj.isDragging = false;
    var dragStarted = false;
    
    var $currentEl = null;
    var $clone = null;
    
    //current element on top of everything
    $(el).click(function(e) {
        $(el).css({'z-index' : ''});
        $(e.target).closest(el).css({'z-index' : 9999999999});
    });
    
    $(elHandler).css({
        cursor  :   'move'
    });
    
    //dragStart
    $(document).on("mousedown", elHandler,function(e){        
        
        if ( typeof $(e.target).closest(el) == 'undefined' ) {
            dragStarted = false;
        } else {
            dragStarted = true;
            $currentEl = obj.currentEl = obj.currentElOriginal = $(e.target).closest(el);
            obj.currentElOriginalStyleAttr = obj.currentElOriginal.attr('style');
            var pos = $currentEl.offset();

            xOffset = e.pageX - pos.left;
            yOffset = e.pageY - pos.top;
        }
    });
    
    
    //dragging
    $(document).mousemove(function(e){
        //e.preventDefault(); //do not use;
        if (dragStarted && $currentEl != null) {
            
            var pageX = e.pageX - (moveOriginal ? xOffset : 0);
            var pageY = e.pageY - (moveOriginal ? yOffset : 0);
            if (position == 'fixed') {
                //adjust position to keep element on screen
                pageX -= $(document).scrollLeft();
                pageY -= $(document).scrollTop();
            }
            
            $(el).css({'z-index' : ''});
            //drag initiated
            if (!isDragging) {
                
                $('body').css({'user-select'   :  'none'}); //prevent text selection during drag events
                if (!moveOriginal) {
                    $clone = $currentEl.clone( cloneEvents );
                    //$('body').append($clone);
                    $clone.insertAfter($currentEl);
                    $currentEl = $clone;
                }
                
                //prevents clicks 
                var $overlay = $('<div></div>');
                $overlay.addClass('SDND overlay');
                $overlay.css({
                    position: 'absolute',
                    top:0,
                    left:0,
                    right:0,
                    bottom:0
                });
                $overlay.append($elOverlay);
                $currentEl.prepend($overlay);
                
                //droppable
                if ( obj.droppableEll instanceof jQuery) {  //instanceof jQuery or instanceof HTMLElement
                    $droppableEl = obj.droppableEl;
                    isDroppable = true;
                } else if (typeof obj.droppableEl == 'string' && obj.droppableEl.trim() != '') {
                    $droppableEl = $(obj.droppableEl);
                    isDroppable = true;
                }
                if(isDroppable) {
                    $droppableEl.removeClass('dropped').removeClass('dragOver').removeClass('dragLeave');
                    droppables = []; //reset
                    $droppableEl.each(function() {
                        var $child = $(this);
                        // and save them in a container for later access
                        droppables.push({
                            $el: $child,
                            rect: new Rectangle( $child.offset().left, $child.offset().top, $child.outerWidth(), $child.outerHeight() )
                        });
                    });

                }
                //user callback function
                callbacks.dragStart(e);
            } 
            
            isDragging = true;
            $currentEl.css({
                'position'  :   position,
                'top'       :   pageY + "px",
                'left'      :   pageX + "px",
                'z-index'   :   9999999999
            });
            

            //droppable
            if (isDroppable) {
                for (var i in droppables) {
                    var alreadyIn = droppables[i].$el.hasClass("dragOver");
                    if ( pointOverRectangle( droppables[i].rect, e.pageX, e.pageY ) ) {
                        //drop enter
                        if (!alreadyIn) {
                            droppables[i].$el.addClass("dragOver");
                            //invoke callback function
                            obj.callbacks.dropEnter(e, droppables[i].$el);
                        } else {   
                            droppables[i].$el.find('.drop-indicator').remove();
                        }
                        var nodeName = $currentEl[0].nodeName;
                        var $dropIndicator = $('<' + nodeName + ' class="drop-indicator"></' + nodeName + '>');
                        $dropIndicator.append(obj.dropOptions.indicator);
                        $dropIndicator.css({
                            width: $currentEl.outerWidth() + 'px',
                            height: $currentEl.outerHeight() + 'px',
                            border: '2px solid',
                            'border-style': 'dashed',
                            'text-align': 'center'
                            
                        });
                        var indicatorAdded = false;
                        
                        //drop before/after child
                        var children = droppables[i].$el.children();
                        if (children.length > 0) {
                            children.each(function(index) {
                                var $child = $(this);
                                //ignore if child is the element being dragged
                                if (!$child.get(0).isEqualNode( $currentEl.get(0))) {
                                    var rect = new Rectangle($child.offset().left, $child.offset().top, $child.outerWidth(), $child.outerHeight());
                                    if (pointOverRectangle( rect, e.pageX, e.pageY ) ) { 
                                        $child.before($dropIndicator);
                                        indicatorAdded = true;
                                    }
                                }
                                
                            });
                        }
                        
                        if (indicatorAdded == false) {
                            $dropIndicator.appendTo(droppables[i].$el);
                        }
                            
                    } else {
                        //drop leave
                        if (alreadyIn) {
                            droppables[i].$el.removeClass("dragOver"); 
                            droppables[i].$el.find('.drop-indicator').remove();
                            //invoke callback function
                            obj.callbacks.dropLeave(e, droppables[i].$el);
                        }
                    }
                }
            }
            
            
        //call user defined function
        callbacks.dragging(e);
     }
    });
    
    //dragEnd
    $(document).mouseup( function(e) {
        //e.preventDefault();
        if (isDragging) {
            
            if (!moveOriginal) {
                $currentEl = $clone;
                var pos = $currentEl.offset();
                if (position == 'fixed') {
                    //adjust position to keep element on screen
                    pos.left -= $(document).scrollLeft();
                    pos.top -= $(document).scrollTop();
                }
                
                $currentEl.css({
                    'position'      :   position,
                    'top'           :   pos.top + 'px',
                    'left'          :   pos.left + 'px'
                });
                
            }
            
            if (revert) {
                    //revert element to original place
                    var style = obj.currentElOriginalStyleAttr;
                    style = (typeof style == 'undefined') ? '' : style;
                    $currentEl.attr('style', style);
            }
            
            //invoke callback function
            callbacks.dragEnd(e);
            
            //droppable || dropped
            if (isDroppable) {
                var dropped = false;
                for (var i in droppables) {
                    if ( pointOverRectangle( droppables[i].rect, e.pageX, e.pageY ) ) {
                        //remove clone
                        if (revert && !moveOriginal) {
                            $clone.remove();
                        } else {
                            droppables[i].$el.find('.drop-indicator').replaceWith($currentEl);
                            droppables[i].$el.addClass("dropped");
                            dropped = true;
                        }
                        
                        //invoke callback function
                        obj.callbacks.dropped(e, droppables[i].$el);
                    }
                }
                
                if (!dropped) {
                    //invoke callback function
                    obj.callbacks.dropCancel(e, droppables[i].$el);
                }
            }
            
            
            $('body').css({'user-select'   :  'text'}); 
        }
        
        
        //reset variables
        isDragging = dragStarted = false;
        $element = $clone = obj.currentEl = obj.currentElOriginal = null;
        
        
            $('.SDND.overlay').remove();
    });
    
}; //SDND.prototype.init end





/*
 *
 *
 *    todo: after droppable
 *
 *
 *
 */
SDND.prototype.resizable = function(elHandler){ //
    var obj = this;
    this.elHandler = (typeof elHandler == 'undefined' || elHandler.trim() === '') ?  obj.el : elHandler;
    this.resizeOptions = {
    };
    this.resizeCallbacks = {
        resizeStart       :   function() { },
        resizing        :   function() { },
        resizeEnd        :   function() { }
    };
};

