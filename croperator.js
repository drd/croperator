var Croperator = new Class({
    initialize: function(img, form) {
        this.inCrop = false;
        this.cropStart = [];
        this.cropEnd = [];
        this.cropDiv = null;
        this.minSize = 10;
        
        this.image = $(img);
        
        this.form = $(form);
        
        $(document.body).addEvent('mousedown', this.mouseDownHandler.bindWithEvent(this));
        $(document.body).addEvent('mouseup',   this.mouseUpHandler.bindWithEvent(this));
        $(document.body).addEvent('mousemove', this.mouseMoveHandler.bindWithEvent(this));
    },
    mouseMoveHandler: function(ev) {     
        this.cropEnd.x = ev.client.x + window.getScrollLeft();
        this.cropEnd.y = ev.client.y + window.getScrollTop();
    },
    mouseDownHandler: function(ev) {
        this.coords = this.image.getCoordinates();
        
        var x = ev.client.x;
        var y = ev.client.y;

        if (x > this.coords.left && x < this.coords.right && y > this.coords.top && y < this.coords.bottom) {
            x += window.getScrollLeft()
            y += window.getScrollTop();
            
            this.initCrop(x, y);
            new Event(ev).stop();
        }
    },
    initCrop: function(x, y) {
        this.inCrop = true;
        
        this.cropStart.x = x;
        this.cropStart.y = y;
        
        if(this.cropInterval == null)
            this.cropInterval = setInterval(this.cropping.bind(this), 75);
        
        this.initializeCropDiv();
    },
    initializeCropDiv: function() {
        var x = this.cropStart.x, y = this.cropStart.y;
        
        if(this.cropDiv == null)
            this.createCropDiv();

        x = this.clamp(x, 0, this.coords.width);
        y = this.clamp(y, 0, this.coords.height);

        if ( x > this.coords.width - this.minSize )
            x -= (this.coords.width - x + this.minSize);

        if ( y > this.coords.width - this.minSize )
            y -= (this.coords.width - y + this.minSize);
        
        this.cropDiv.setStyles({
            left: x,
            top: y,
            width: this.minSize,
            height: this.minSize
        });
    },
    createCropDiv: function() {
        this.cropDiv = new Element('div', {
                styles: {
                    border: '1px dashed #ccc',

                    position: 'absolute',

                    'z-index': 100
                }
            });
        
        this.cropDiv.injectBefore(this.image);
        $(this.cropDiv.parentNode).setStyle('position', 'relative');
    },
    mouseUpHandler: function(ev) {
        this.inCrop = false;
        
        if(this.cropInterval != null)
            this.cropInterval = clearInterval(this.cropInterval);

        this.cropStart = [];
        this.cropEnd = [];
    },
    cropping: function() {
        this.drawCrop();
    },
    drawCrop: function() {
        var x1, y1, width, height;
        
        x1 = this.cropStart.x < this.cropEnd.x ? this.cropStart.x : this.cropEnd.x;
        y1 = this.cropStart.y < this.cropEnd.y ? this.cropStart.y : this.cropEnd.y;
        
        x1 = this.clamp(x1, 0, this.coords.width);
        y1 = this.clamp(y1, 0, this.coords.height);

        x2 = this.cropStart.x > this.cropEnd.x ? this.cropStart.x : this.cropEnd.x;
        y2 = this.cropStart.y > this.cropEnd.y ? this.cropStart.y : this.cropEnd.y;
        
        x2 = this.clamp(x2, 0, this.coords.width);
        y2 = this.clamp(y2, 0, this.coords.height);

        width  = Math.abs(x1 - x2);
        height = Math.abs(y1 - y2);
        
        width  = this.clamp(width,  this.minSize, this.coords.width - x1 - 2);
        height = this.clamp(height, this.minSize, this.coords.height - y1 - 2);
        
        if (x1 == x2 && width == this.minSize) x1 -= this.minSize;
        if (y1 == y2 && height == this.minSize) y1 -= this.minSize;
        
        x2 = x1 + width;
        y2 = y1 + height;
        
        this.cropDiv.setStyles({
            left:   x1,
            top:    y1,
            width:  width,
            height: height
        });
        
        this.updateForm(x1, y1, x2, y2, width, height);
    },
    updateForm: function(x1, y1, x2, y2, width, height) {
        this.form.x1.value = x1;
        this.form.y1.value = y1;
        this.form.x2.value = x2;
        this.form.y2.value = y2;
        this.form.width.value = width;
        this.form.height.value = height;
    },
    clamp: function(val, min, max) {
        return Math.max(min, Math.min(max, val))
    }
});