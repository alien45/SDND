/*
 * Simple DragNDrop
 * Author: Toufiqur Chowdhury
 * 
 */
/*
    document all css changes while dragging and revert to original state if revert = true
*/

//define object
var SDND = function(el) {   
    this.el = el;//draggable element jQuery selector
    this.currentEl = null; //
    this.currentElOriginal = null;
    this.currentElOriginalStyleAttr = null;//position, top , left
    //set default options
    this.options = {
        'moveOriginal'      :   true,
        'revert'            :   false,  // if moveOriginal = false
        'cloneEvents'       :   true,   // whether to preserve events when cloning element << if moveOriginal = false
        'elHandler'        :   '',      // jQuery selector that will control/initiate drag
        'elOverlay'         :   ''      // jQuery selector or object accepted
    };
    
    this.callbacks = {
        dragStart       :   function() { },
        dragging        :   function() { },
        dragEnd        :   function() { }
    };
    this.data = {};                     //optional || could be useful for droppable function
    
};



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
    
    
    var xOffset = 0
    var yOffset = 0;
    var isDragging = false;
    var dragStarted = false;
    
    var $currentEl = null;
    var $clone = null;
    
    //bring clicked draggable element on top of everything
    $(el).click(function(e) {
        //e.preventDefault();
        $(el).css({'z-index' : ''});
        $(e.target).closest(el).css({'z-index' : 9999999999});
    });
    
    $(elHandler).css({
        cursor  :   'move'
    });
    
    //dragStart
    $(document).on("mousedown", elHandler,function(e){
        console.log("mousedown: " + e.target.nodeName);
        //e.preventDefault();
        
        
        $currentEl = obj.currentEl = obj.currentElOriginal = $(e.target).closest(el);
        if ( typeof $currentEl == 'undefined' ) {
            dragStarted = false;
        } else {
            dragStarted = true;
            obj.currentElOriginalStyleAttr = obj.currentElOriginal.attr('style');
            var pos = $currentEl.offset();
            xOffset = e.pageX - pos.left;
            yOffset = e.pageY - pos.top;
            $('body').css({'user-select'   :  'none'}); //make text unselectable only during drag
        }
    });
    
    
    //onDrag
    /*
        $(document).on('mousemove', elHandler, function(){}) causes lags and looses fluidity..... 
        especially if the element contains video/embed
        this is most likely the reason jQuery-ui has the same issues
    */
    $(document).mousemove(function(e){
        //e.preventDefault(); //do not use
        
        if (dragStarted) {
            $(el).css({'z-index' : ''});
             var top = 0;
             var left = 0;
            //first time dragging
            if (!isDragging) {
                //user callback function
                callbacks.dragStart();
            }
            if (!moveOriginal && !isDragging) {
                $clone = $currentEl.clone( cloneEvents );
                top = e.pageY;
                left = e.pageX;
                //$('body').append($clone);
                $clone.insertAfter($currentEl);
            } else {
                top = e.pageY - yOffset;
                left = e.pageX - xOffset;
            }
            isDragging = true;
            $currentEl = (moveOriginal) ? $currentEl : $clone;
            $currentEl.css({
                'position'  :   'fixed',
                'top'       :   top + "px",
                'left'      :   left + "px",
                'z-index'   :   9999999999
            });
             
            
            
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
        //call user defined function
        callbacks.dragging();
     }
    });
    
    //dragEnd
    /*
        $(document).on('mouseup', elHandler, function(e){}); casuses the embed to become unclickable
    */
    $(document).mouseup( function(e){
        //e.preventDefault();
        if (isDragging) {
            if (!moveOriginal) {
                $currentEl = $clone;
                pos = $currentEl.position(); 
                $currentEl.css({
                    'position'      :   'fixed',
                    'top'           :   pos.top + 'px',
                    'left'          :   pos.left + 'px'
                });
                if (revert) $clone.remove();
            } else {
                if (revert) {
                    var style = obj.currentElOriginalStyleAttr;
                    style = (typeof style == 'undefined') ? '' : style;
                    $currentEl.attr('style', style);
                }
            }
            callbacks.dragEnd();
            $currentEl.find('.SDND.overlay').remove();
            $('body').css({'user-select'   :  'text'});
        }
        
        
        //reset variables
        isDragging = dragStarted = false;
        $element = $clone = obj.currentEl = obj.currentElOriginal = null;
    });
    
}; //SDND.prototype.init end





/*
 * to do: make droppable
*/

SDND.prototype.droppable = function(elDrop){ //
    this.elDrop = elDrop;
    this.dropOptions = {
    }
    this.dropCallbacks = {
        dropEnter       :   function() { },
        dropLeave        :   function() { },
        dropCancel        :   function() { },
        dropping        :   function() { },
        dropped        :   function() { }
    };
};

SDND.prototype.initDroppable = function(){
    var obj = this;
    var elDrop = obj.elDrop;
    var el = obj.el;
    var moveOriginal = this.options.moveOriginal;
    var dragOptions = this.dropOptions;

}
            