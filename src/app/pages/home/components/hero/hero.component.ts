import { Component } from '@angular/core';
import { CustomButtonComponent } from '../../../../components/buttons/custom-button/custom-button.component';
import { UserTypeModalComponent } from '../../user-type-modal/user-type-modal.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CustomButtonComponent, UserTypeModalComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {

}
