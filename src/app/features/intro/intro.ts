// intro.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-intro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro.html',
  styleUrls: ['./intro.scss']
})
export class Intro implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationId!: number;
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private nebulaClouds: NebulaCloud[] = [];
  
  showLogos = false;
  fadeOut = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Mostrar logos después de 1 segundo
    setTimeout(() => {
      this.showLogos = true;
    }, 1000);

    // Fade out después de 2.5 segundos
    setTimeout(() => {
      this.fadeOut = true;
    }, 2500);

    // Redirigir después de 3 segundos
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 3000);
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.createParticles();
    this.createStars();
    this.createNebulaClouds();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  private createParticles() {
    const particleCount = 150;
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        Math.random() * 2 + 0.5,
        `hsl(${Math.random() * 60 + 180}, 70%, ${Math.random() * 30 + 50}%)`
      ));
    }
  }

  private createStars() {
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
      this.stars.push(new Star(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        Math.random() * 2 + 0.5,
        Math.random() * 0.02 + 0.01
      ));
    }
  }

  private createNebulaClouds() {
    const cloudCount = 8;
    
    for (let i = 0; i < cloudCount; i++) {
      this.nebulaClouds.push(new NebulaCloud(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        Math.random() * 200 + 100,
        `hsla(${Math.random() * 60 + 240}, 60%, 40%, 0.1)`
      ));
    }
  }

  private animate = () => {
    this.ctx.fillStyle = 'rgba(5, 5, 15, 0.1)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Dibujar nebulosas
    this.nebulaClouds.forEach(cloud => {
      cloud.update();
      cloud.draw(this.ctx);
    });

    // Dibujar estrellas
    this.stars.forEach(star => {
      star.update();
      star.draw(this.ctx);
    });

    // Dibujar partículas
    this.particles.forEach(particle => {
      particle.update();
      particle.draw(this.ctx);
    });

    this.animationId = requestAnimationFrame(this.animate);
  };
}

class Particle {
  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public size: number,
    public color: string
  ) {}

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around screen
    if (this.x < 0) this.x = window.innerWidth;
    if (this.x > window.innerWidth) this.x = 0;
    if (this.y < 0) this.y = window.innerHeight;
    if (this.y > window.innerHeight) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Star {
  private opacity: number = Math.random();
  private opacityDirection: number = 1;

  constructor(
    public x: number,
    public y: number,
    public size: number,
    public twinkleSpeed: number
  ) {}

  update() {
    this.opacity += this.opacityDirection * this.twinkleSpeed;
    
    if (this.opacity >= 1) {
      this.opacity = 1;
      this.opacityDirection = -1;
    } else if (this.opacity <= 0.3) {
      this.opacity = 0.3;
      this.opacityDirection = 1;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
  }
}

class NebulaCloud {
  private angle: number = 0;

  constructor(
    public x: number,
    public y: number,
    public size: number,
    public color: string
  ) {}

  update() {
    this.angle += 0.005;
    this.x += Math.sin(this.angle) * 0.5;
    this.y += Math.cos(this.angle) * 0.3;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}