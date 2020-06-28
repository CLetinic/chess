import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  color: boolean;
  colour1 : string = 'light-section';
  colour2 : string = 'dark-section';

  counter(i: number) {
    console.log(i);
    return new Array(i);
  }

  mod(a: number) {

    if (a % 8 == 0)
    {
      // invert colour
      this.colour1  = this.colour1 == 'light-section' ? 'dark-section' : 'light-section';
      this.colour2  = this.colour2 == 'dark-section' ? 'light-section' : 'dark-section';
    }

    if(a % 2 == 0)
      return true;
    else
      return false;
  }

}
