import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { CardModule } from 'primeng/card';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Define la interfaz para los miembros del equipo
interface TeamMember {
  name: string;
  photo: string;
  professionalTitle: string;
  description: string;
  linkedin: string;
  instagram: string;
}

@Component({
  selector: 'app-us',
  templateUrl: './us.html',
  styleUrls: ['./us.scss'],
  standalone: true,
  imports: [CommonModule, NgIf, CardModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UsComponent implements OnInit {

  // Array con los datos de los miembros del equipo
  teamMembers: TeamMember[] = [
    {
      name: 'Jhonattan Pinzon',
      photo: 'assets/imagenes/grupo/jhonattan.jpeg',
      professionalTitle: 'Frontend Developer & Electronics Engineer',
      description: 'Frontend developer passionate about space and knowledge. Hard worker dedicated to creating exceptional user experiences.',
      linkedin: 'https://www.linkedin.com/in/jhonattan-sabogal-pinz%C3%B3n-4584ab23a/',
      instagram: 'https://www.instagram.com/paco_pinz/',
    },
    {
      name: 'Oliver Velasquez',
      photo: 'assets/imagenes/grupo/Oliver.jpeg',
      professionalTitle: 'Software Developer & Electronics Engineer',
      description: 'Electronicss engineer by training, software developer by passion. I create intuitive interfaces and backends using Node.js. Inspired by AI, nature, and creativity.',
      linkedin: 'https://www.linkedin.com/in/olivervlz/',
      instagram: 'https://www.instagram.com/oliver.vlz/',
    },
    {
      name: 'Lina Castañeda',
      photo: 'assets/imagenes/grupo/lina.jpg',
      professionalTitle: 'Software Developer & Electronics Engineer',
      description: 'Science lover focused on developing cutting-edge weather monitoring systems. Expert in IoT and sensor technologies for environmental applications.',
      linkedin: 'https://www.linkedin.com/in/linacast/',
      instagram: 'https://www.instagram.com/1.lmcc/',
    },
    {
      name: 'Violeta Jaramillo Castañeda ',
      photo: 'assets/imagenes/grupo/violet.png',
      professionalTitle: 'Marketing and Linguistics',
      description: 'I\'m pursuing a double degree in sustainable marketing and entrepreneurship, with multilingual skills in English, French, and Portuguese. I specialize in digital communication and creating multilingual marketing strategies.',
      linkedin: 'https://www.linkedin.com/',
      instagram: 'https://www.instagram.com/violett_velvet_/',
    },
  ];

  // Propiedad para guardar el miembro seleccionado. Puede ser un objeto TeamMember o null.
  selectedMember: TeamMember | null = null;

  constructor() {}

  ngOnInit(): void {
    // No seleccionamos a nadie por defecto para que aparezca el logo.
  }

  // Función para actualizar el miembro seleccionado cuando el ratón pasa por encima
  selectMember(member: TeamMember): void {
    this.selectedMember = member;
  }
}
