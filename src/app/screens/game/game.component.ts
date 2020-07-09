import { Component, OnInit, NgZone, ChangeDetectorRef} from '@angular/core';
// import { style } from '@angular/animations';
import { SnackbarService } from '../../services/snackbar/snackbar.service';
import { SocketService } from 'src/app/services/socket/socket.service';
import { PlayerlookupService } from 'src/app/services/playerlookup/playerlookup.service';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {


  pieceLastPosition = "";
  color: boolean;

  pieceDark: string = 'var(--chesspiece-dark)';
  pieceLight: string = 'var(--chesspiece-light)';
  blockColour1: string = 'light-section';
  blockColour2: string = 'dark-section';

  dragging: boolean = true;
  dropping: boolean = true;

  showPrmotion: boolean = false;
  selectedPromotion:string;

  private socket: any;
  private sessionId: string;

  chessboard : any; // load/save chess board to server 
  moveList : any;

  block: any;
  data: any;

  players : any = { white: null, black: null};

  playerLookup : PlayerlookupService;

  constructor(private snackbarService: SnackbarService, private socketService : SocketService, private ref: ChangeDetectorRef, private playerLookupService : PlayerlookupService) {

    this.socket = socketService.socket;
    this.sessionId = socketService.sessionID;
    this.playerLookup = playerLookupService;

  }

  getMoves(position : string) : void {
    this.socket.emit("getMoves", this.sessionId, position);
  }


  move(from : string, to : string) : void{

    this.socket.emit("move", this.sessionId, from, to);
  }

  ngOnInit(): void {

    //this.snackbarService.show('test','success', 3000);
    //let ret = this.snackbarService.promote(true);
    
    this.socket.emit("getBoard", this.sessionId);

    this.socket.on("postBoard", data => {
      console.log("hi there");
      this.chessboard = [];
      for (let item of data) {
        this.chessboard.push(item);
      }
    })

    this.socket.on("postUsersForSession", data => {
      this.players.white = data.playerWhite;
      this.players.black = data.playerBlack;
    });


    this.socket.emit("getUsersForSession", this.sessionId);


    this.socket.on("postMoves", data =>{
      console.log('Moves' , data);
      this.moveList = data;

      for (let index = 0; index < this.moveList.length; index++) {
        // chess notation
        //[Piece][Position] // Standard move
        //[Piece][Rank][Position] // Disambiguating standard move
        //[Piece]x[Position] // Capturing
        //[Column]x[Position]e.p. // En passant captures  // used as flag instead
        //[Position]=[Promotion] // Promoting Pawn
        // "(=)" // Draw ?
        //[Position]+ // Check
        // "O-O" // Castling (king side) - this can probably be hard coded
        // "O-O-O" // Castling (queen side)
        // # or ++  // Checkmate?
  
        let block = this.moveList[index].slice(-2);
  
        document.getElementById(block).classList.add("avaliableMove");
      }
    });

    this.socket.on("moveResult", response => {
      
      let checkMove = response;

      console.log("Move result",checkMove);
    
      if (checkMove) { 
  
        // Flags
        // 'n' - a non-capture
        // 'b' - a pawn push of two squares
        // 'e' - an en passant capture
        // 'c' - a standard capture
        // 'p' - a promotion
        // 'k' - kingside castling
        // 'q' - queenside castling
  
        if (checkMove.flags.includes('c')) 
          this.removePieceFromChildNode(this.block);
  
        this.pieceLastPosition = "";
        this.block.firstChild.appendChild(document.getElementById(this.data));
  
        if (checkMove.flags.includes('e')) {
          //eg
            // b d7 > d5    w e5 > d6   w  en passant captures b on d5
            // w d2 > d4    b e4 > d3   b  en passant captures w on d4
  
          let passantBlockID = '';
          if (checkMove.color === "w")
            passantBlockID = (this.block.id[0] + (parseInt(this.block.id[1]) - 1).toString());
          else 
            passantBlockID = (this.block.id[0] + (parseInt(this.block.id[1]) + 1).toString());
  
          this.removePieceFromChildNode(document.getElementById(passantBlockID));
        }
      }
      this.removeBlockHighlighting();

      this.dragging = true;
      this.socket.emit("getBoard", this.sessionId);
    
    });

  }

  counter(i: number) {
    console.log(i);
    return new Array(i);
  }

  generateBlockID(row: number, column: number) {
    let columnLetter = String.fromCharCode(column + 97);

    return (columnLetter + (8 - row));
  }

  mod(a: number) {

    if (a % 8 == 0) {
      // invert colour
      this.blockColour1 = this.blockColour1 == 'light-section' ? 'dark-section' : 'light-section';
      this.blockColour2 = this.blockColour2 == 'dark-section' ? 'light-section' : 'dark-section';
    }

    if (a % 2 == 0)
      return true;
    else
      return false;
  }

  allowDrop(ev) {
    console.log("alowdrop");
    // if (canDrop)

    ev.preventDefault();
  }

  drag(ev) {
    let user : any = localStorage.getItem("userData");

    let colour : string = this.playerLookup.getUserColour(user.email);
    console.log(colour);
    console.log(ev);
    this.showPrmotion = false;

    this.removeBlockHighlighting();

    this.pieceLastPosition = ev.target.closest(".block").id;

    console.log("Last position of piece",this.pieceLastPosition);
    ev.dataTransfer.setData("text", ev.target.id);

    if (this.dragging) {
      this.dragging = false;
      this.getMoves(this.pieceLastPosition);
    }

  }

  drop(ev) {
    //this.snackbarService.show('test','success', 3000);
    this.showPrmotion = true;

    console.log("Piece dropped");

    ev.preventDefault();
    this.data = ev.dataTransfer.getData("text");

    this.block = ev.target.closest(".block");

    this.move(this.pieceLastPosition, this.block.id);
  }
  
  removePieceFromChildNode(blockNode) {
    blockNode.firstChild.childNodes.forEach(element => {

      let name = element.nodeName.toLowerCase();
      if (name === "app-pawn" || name === "app-queen" || name === "app-bishop" || name === "app-knight" || name === "app-rook")
        element.remove();

    });
  }

  removeBlockHighlighting() {
    let highlighted = document.getElementsByClassName("avaliableMove");

    while (highlighted.length > 0) {
      highlighted[0].classList.remove(("avaliableMove"));
    }
  }

  receiveSelectedPromotion($event) {
    this.selectedPromotion = $event
    console.log("incoming: " + this.selectedPromotion);

    this.showPrmotion = false;
  }


}
