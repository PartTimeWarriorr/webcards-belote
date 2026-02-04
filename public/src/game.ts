import Konva from 'konva';
import type { Card } from './card.types.js';
import type { Vector2d } from 'konva/lib/types';
import { Board } from './board.js';

const stage = new Konva.Stage({
    container: "container",
    width: window.innerWidth,
    height: window.innerHeight,
});

const layer = new Konva.Layer();
const dragLayer = new Konva.Layer();

let board = new Board(layer);
board.visualizeHand();

stage.add(layer);


// const imageObj = new Image();
// imageObj.src = "/cards/1B.svg";
// const IMAGE_SCALE = 2;

// imageObj.onload = () => {
//     const card = new Konva.Image({
//         x: 0,
//         y: 0,
//         image: imageObj,
//         width: imageObj.width / IMAGE_SCALE,
//         height: imageObj.height / IMAGE_SCALE,
//         draggable: true,
//     }) as Card;
//     card.dragStartX = 0;
//     card.dragStartY = 0;

//     card.on("mouseover", function() {
//         document.body.style.cursor = "pointer";
//     });

//     card.on("mouseout", function() {
//         document.body.style.cursor = "default";
//     });

//     card.on("dragstart", function(e) {
//         card.moveTo(dragLayer);
//         card.dragStartX = card.x();
//         card.dragStartY = card.y();
//         console.log(card.dragStartX, card.dragStartY)
//     });

//     card.on("dragend", function (e) {
//         const pos = stage.getPointerPosition();

//         if (pos == null) {
//             console.log("opaaa");
//             return;
//         }
        
//         const shape = layer.getIntersection(pos);

//         let data = {name: ""};
//         if (shape != null) {
//             data = shape.getAttr("metadata") ?? {name : ""};
//         }

//         const startPosition : Vector2d = { x : card.dragStartX, y : card.dragStartY };
//         if (data.name != "PlayField") {
//             card.setPosition(startPosition);
//         }
//     });

//     layer.add(card);
// }

// const playFieldScale = 4;
// const field = new Konva.Rect({
//     x: window.screenX + window.innerWidth / playFieldScale,
//     y: window.screenY + window.innerHeight / playFieldScale,
//     width: window.innerWidth / 2,
//     height: window.innerHeight / 2,
//     fill: "blue",
// });
// field.setAttr("metadata", {
//     name: "PlayField",
// });

// layer.add(field);


// stage.add(layer);
// stage.add(dragLayer);

// function loadHand() {
    
// }