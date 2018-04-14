/*
	EXPLORER
*/

/*
TODO
X make object
X move code out of editor.js
- what are shared functions? need to share with animation preview thumbnail
- make it support multiple instances
- how to handle selected drawing?? (type + id)
- rename methods to be less verbose
- test in mobile
- use in editor
- method to update thumbnail caption text
*/

function PaintExplorer(idPrefix,selectCallback) {

	var drawingThumbnailCanvas, drawingThumbnailCtx;
	drawingThumbnailCanvas = document.createElement("canvas");
	drawingThumbnailCanvas.width = 8 * scale; // TODO: scale constants need to be contained somewhere
	drawingThumbnailCanvas.height = 8 * scale;
	drawingThumbnailCtx = drawingThumbnailCanvas.getContext("2d");

	/*
	TODO: make variables for all the IDs that use idPrefix that we can store
	*/

	var drawingCategory = null; // TODO: support multiple drawing categories in a list (possibly)
	var selectedDrawingId = null;

	var displayCaptions = true;
	this.SetDisplayCaptions = function(display) {
		displayCaptions = display;
	}

	function refresh( type, doKeepOldThumbnails, filterString, skipRenderStep ) {
		drawingCategory = type;

		if( drawingCategory == null )
			return;

		if( doKeepOldThumbnails == null || doKeepOldThumbnails == undefined )
			doKeepOldThumbnails = false;

		var doFilter = filterString != null && filterString != undefined && filterString.length > 0;

		if( skipRenderStep == null || skipRenderStep == undefined )
			skipRenderStep = false;

		var idList = [];
		if( drawingCategory == TileType.Avatar ) {
			idList = ["A"];
		}
		else if( drawingCategory == TileType.Sprite ) {
			idList = sortedSpriteIdList();
		}
		else if ( drawingCategory == TileType.Tile ) {
			idList = sortedTileIdList();
		}
		else if ( drawingCategory == TileType.Item ) {
			idList = sortedItemIdList();
		}

		var hexPalette = [];
		for (id in palette) {
			for (i in getPal(id)){
				var hexStr = rgbToHex( getPal(id)[i][0], getPal(id)[i][1], getPal(id)[i][2] ).slice(1);
				hexPalette.push( hexStr );
			}
		}

		var paintExplorerForm = document.getElementById(idPrefix + "FormInner");
		if( !doKeepOldThumbnails )
			paintExplorerForm.innerHTML = "";
		
		for(var i = 0; i < idList.length; i++) {
			var id = idList[i];
			if(id != "A" || drawingCategory == TileType.Avatar)
			{
				if(!skipRenderStep) {
					if( !doKeepOldThumbnails )
						addThumbnail( id ); // create thumbnail element and render thumbnail
					else
						renderThumbnail( id ); // just re-render the thumbnail
				}

				if( doFilter )
					filterThumbnail( id, filterString );
				else
					document.getElementById(idPrefix + "Label_" + id).style.display = "inline-block"; // make it visible otherwise
			}
		}
	}
	this.Refresh = function( type, doKeepOldThumbnails, filterString, skipRenderStep ) {
		refresh( type, doKeepOldThumbnails, filterString, skipRenderStep );
	};

	function addThumbnail(id) {
		if( drawingCategory == null ) // TODO: used combined id + type instead?
			return;

		var paintExplorerForm = document.getElementById(idPrefix + "FormInner");

		var radio = document.createElement("input");
		radio.type = "radio";
		radio.name = idPrefix + "Radio";
		radio.id = idPrefix + "Radio_" + id;
		radio.value = id;
		radio.checked = id === selectedDrawingId;

		paintExplorerForm.appendChild(radio);

		var label = document.createElement("label");
		label.htmlFor = idPrefix + "Radio_" + id;
		label.id = idPrefix + "Label_" + id;

		var div = document.createElement("div");
		// div.style.width = "100px";
		// div.style.display = "inline-block";

		var img = document.createElement("img");
		img.id = idPrefix + "Thumbnail_" + id;

		// TODO : make image title not show up while loading image? or style the size?
		if( drawingCategory === TileType.Tile )
			img.title = tile[id].name ? tile[id].name : "tile " + id;
		else if( drawingCategory === TileType.Sprite )
			img.title = sprite[id].name ? sprite[id].name : "sprite " + id;
		else if( drawingCategory === TileType.Avatar )
			img.title = "avatar";
		else if( drawingCategory === TileType.Item )
			img.title = item[id].name ? item[id].name : "item " + id;

		img.classList.add("explorerThumbnail"); // NEW

		div.appendChild(img);

		if(displayCaptions) {
			var nameCaption = document.createElement("figcaption");
			nameCaption.id = idPrefix + "Caption_" + id;

			nameCaption.innerText = img.title;
			var curPaintMode = drawingCategory;
			var drawingId = new DrawingId( curPaintMode, id );
			var obj = drawingId.getEngineObject();
			if( obj.name === undefined || obj.name === null ) {
				console.log("default name!!!!");
				nameCaption.classList.add( "thumbnailDefaultName" );
			}

			div.appendChild(nameCaption);
		}

		label.appendChild(div);

		paintExplorerForm.appendChild(label);

		radio.onclick = selectCallback;

		renderThumbnail( id );
	}
	this.AddThumbnail = function(id) {
		addThumbnail(id);
	};

	function filterThumbnail(id,filterString) {
		var label = document.getElementById(idPrefix + "Label_" + id);
		var img = document.getElementById(idPrefix + "Thumbnail_" + id);
		var thumbTitle = img.title;

		var foundFilter = thumbTitle.indexOf( filterString ) > -1;

		label.style.display = foundFilter ? "inline-block" : "none";
	}

	// TODO : pull out core of this to make it re-usable
	var thumbnailRenderEncoders = {};
	function renderThumbnail(id) {
		if( drawingCategory == null ) // TODO: used combined id + type instead?
			return;

		var hexPalette = []; // TODO this is a bit repetitive to do all the time, huh?
		for (pal in palette) {
			for (i in getPal(pal)){
				var hexStr = rgbToHex( getPal(pal)[i][0], getPal(pal)[i][1], getPal(pal)[i][2] ).slice(1);
				hexPalette.push( hexStr );
			}
		}

		// console.log(id);
		var img = document.getElementById(idPrefix + "Thumbnail_" + id);

		var drawingFrameData = [];
		if( drawingCategory == TileType.Tile ) {
			// console.log(tile[id]);
			drawTile( getTileImage( tile[id], getRoomPal(curRoom), 0 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
			drawTile( getTileImage( tile[id], getRoomPal(curRoom), 1 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
		}
		else if( drawingCategory == TileType.Sprite || drawingCategory == TileType.Avatar ){
			// console.log(sprite[id]);
			drawSprite( getSpriteImage( sprite[id], getRoomPal(curRoom), 0 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
			drawSprite( getSpriteImage( sprite[id], getRoomPal(curRoom), 1 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
		}
		else if( drawingCategory == TileType.Item ) {
			drawItem( getItemImage( item[id], getRoomPal(curRoom), 0 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
			drawItem( getItemImage( item[id], getRoomPal(curRoom), 1 ), 0, 0, drawingThumbnailCtx );
			drawingFrameData.push( drawingThumbnailCtx.getImageData(0,0,8*scale,8*scale).data );
		}

		// create encoder
		var gifData = {
			frames: drawingFrameData,
			width: 8*scale,
			height: 8*scale,
			palette: hexPalette,
			loops: 0,
			delay: animationTime / 10 // TODO why divide by 10???
		};
		var encoder = new gif();

		// cancel old encoder (if in progress already)
		if( thumbnailRenderEncoders[id] != null )
			thumbnailRenderEncoders[id].cancel();
		thumbnailRenderEncoders[id] = encoder;

		// start encoding new GIF
		encoder.encode( gifData, createThumbnailRenderCallback(img) );
	}
	this.RenderThumbnail = function(id) {
		renderThumbnail(id);
	};

	function changeSelection(id) {
		selectedDrawingId = id; // store that value
		var paintExplorerForm = document.getElementById(idPrefix + "FormInner");
		for( var i = 0; i < paintExplorerForm.childNodes.length; i++ ) {
			var child = paintExplorerForm.childNodes[i];
			if( child.type && child.type === "radio" ) {
				if( child.id === idPrefix + "Radio_" + id )
					child.checked = true;
				else
					child.checked = false;
			}
		}
	}
	this.ChangeSelection = function(id) {
		changeSelection(id);
	};

	function deleteThumbnail(id) {
		var paintExplorerForm = document.getElementById(idPrefix + "FormInner");
		paintExplorerForm.removeChild( document.getElementById( idPrefix + "Radio_" + id ) );
		paintExplorerForm.removeChild( document.getElementById( idPrefix + "Label_" + id ) );
	}
	this.DeleteThumbnail = function(id) {
		deleteThumbnail(id);
	};


	function changeThumbnailCaption(id,captionText) {
		document.getElementById(idPrefix + "Thumbnail_" + id).title = captionText;
		var caption = document.getElementById(idPrefix + "Caption_" + id);
		caption.innerText = captionText;
		var obj = (new DrawingId(drawingCategory,id)).getEngineObject();
		if( obj.name ) {
			if( caption.classList.contains("thumbnailDefaultName") )
				caption.classList.remove("thumbnailDefaultName");
		}
		else {
			if( !caption.classList.contains("thumbnailDefaultName") )
				caption.classList.add("thumbnailDefaultName");
		}
	}
	this.ChangeThumbnailCaption = function(id,captionText) {
		changeThumbnailCaption(id,captionText);
	}
}

// TODO : what to do with free floating functions??
function createThumbnailRenderCallback(img) {
	return function(uri) { img.src = uri; img.style.background = "none"; };
}