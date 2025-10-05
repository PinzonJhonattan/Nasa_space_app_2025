import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { ImageModule } from 'primeng/image';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ActivityConfigService } from '../../share/services/activity-config.service';
import { Activity } from '../../share/models/activity.model';

interface CategoryOption {
  label: string;
  value: string;
  color: 'success' | 'warning' | 'info' | 'warn' | 'secondary';
}

@Component({
  selector: 'app-nueva-actividad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    ImageModule,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './nueva-actividad.html',
  styleUrls: ['./nueva-actividad.scss']
})
export class NuevaActividadComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private activityService = inject(ActivityConfigService);
  private messageService = inject(MessageService);

  activityForm: FormGroup;
  isLoading = signal(false);
  selectedImagePreview = signal<string | null>(null);
  showNewCategoryInput = signal(false);
  showCustomImageUrl = signal(false);

  categoryOptions: CategoryOption[] = [
    { label: 'Deporte', value: 'Deporte', color: 'success' },
    { label: 'Agricultura', value: 'Agricultura', color: 'warning' },
    { label: 'Transporte', value: 'Transporte', color: 'info' },
    { label: 'Turismo', value: 'Turismo', color: 'warn' },
    { label: 'Evento', value: 'Evento', color: 'secondary' }
  ];

  get allCategoryOptions(): CategoryOption[] {
    return [...this.categoryOptions, { label: '+ Nueva categoría', value: 'nueva', color: 'info' }];
  }

  predefinedImages: string[] = [
    'assets/gif/correr.gif',
    'assets/gif/pescador.gif',
    'assets/gif/nadador.gif',
    'assets/gif/avion.gif',
    'assets/gif/verduras.gif',
    'assets/gif/vaca.gif'
  ];

  constructor() {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      category: ['', Validators.required],
      newCategory: [''],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      imageUrl: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Establecer la primera imagen como predeterminada
    this.activityForm.patchValue({ imageUrl: this.predefinedImages[0] });

    this.activityForm.get('imageUrl')?.valueChanges.subscribe(value => {
      this.selectedImagePreview.set(value);
    });
  }

  get title() { return this.activityForm.get('title'); }
  get category() { return this.activityForm.get('category'); }
  get newCategory() { return this.activityForm.get('newCategory'); }
  get description() { return this.activityForm.get('description'); }
  get imageUrl() { return this.activityForm.get('imageUrl'); }

  selectPredefinedImage(imageUrl: string) {
    this.activityForm.patchValue({ imageUrl });
    this.showCustomImageUrl.set(false);
  }

  onCategoryChange(event: any) {
    const value = event.value || event;
    console.log('Category changed to:', value);

    if (value === 'nueva') {
      this.showNewCategoryInput.set(true);
      this.activityForm.get('newCategory')?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(20)]);
      this.activityForm.get('newCategory')?.updateValueAndValidity();
    } else {
      this.showNewCategoryInput.set(false);
      this.activityForm.get('newCategory')?.clearValidators();
      this.activityForm.get('newCategory')?.setValue('');
      this.activityForm.get('newCategory')?.updateValueAndValidity();
    }
  }

  toggleCustomImageUrl() {
    this.showCustomImageUrl.update(value => !value);
    if (!this.showCustomImageUrl()) {
      // Si se cierra el custom URL, volver a la primera imagen predefinida
      this.activityForm.patchValue({ imageUrl: this.predefinedImages[0] });
    } else {
      // Si se abre el custom URL, limpiar el campo para que el usuario ingrese su URL
      this.activityForm.patchValue({ imageUrl: '' });
    }
  }

  onSubmit() {
    // Validación especial para nueva categoría
    const isValid = this.validateForm();

    if (isValid && this.activityForm.valid) {
      this.isLoading.set(true);

      const formValue = this.activityForm.value;

      // Determinar la categoría final (existente o nueva)
      let finalCategory = formValue.category;
      let categoryColor: 'success' | 'warning' | 'info' | 'warn' | 'secondary' = 'secondary';

      if (formValue.category === 'nueva' && formValue.newCategory) {
        finalCategory = formValue.newCategory;
        categoryColor = 'info'; // Color por defecto para categorías nuevas
        console.log('Nueva categoría creada:', finalCategory);
      } else {
        const categoryOption = this.categoryOptions.find(opt => opt.value === formValue.category);
        categoryColor = categoryOption?.color || 'secondary';
        console.log('Categoría existente seleccionada:', finalCategory);
      }

      console.log('Datos finales de la actividad:', {
        title: formValue.title,
        category: finalCategory,
        categoryColor: categoryColor,
        description: formValue.description
      });

      // Generar contexto automáticamente desde título y descripción
      const generatedContext = this.generateChatbotContext(formValue.title, formValue.description, finalCategory);

      const newActivity: Activity = {
        id: Date.now(),
        title: formValue.title,
        category: finalCategory,
        categoryColor: categoryColor,
        description: formValue.description,
        imageUrl: formValue.imageUrl,
        routerLink: `/activity/${this.activityService.normalizeActivityId(formValue.title)}`
      };

      this.activityService.addCustomActivity(newActivity, generatedContext);

      // Mensaje específico si se creó nueva categoría
      const successMessage = formValue.category === 'nueva'
        ? `Actividad creada con nueva categoría "${finalCategory}". Redirigiendo al configurador de pronóstico...`
        : 'Actividad creada exitosamente. Redirigiendo al configurador de pronóstico...';

      this.messageService.add({
        severity: 'success',
        summary: 'Actividad Creada',
        detail: successMessage
      });

      const activityId = this.activityService.normalizeActivityId(formValue.title);

      setTimeout(() => {
        this.isLoading.set(false);
        this.router.navigate([`/activity/${activityId}`]);
      }, 1500);
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error en el formulario',
        detail: 'Por favor completa todos los campos requeridos correctamente'
      });
    }
  }

  private validateForm(): boolean {
    // Validar que si se selecciona "nueva categoría", el campo newCategory tenga valor
    const categoryValue = this.activityForm.get('category')?.value;
    const newCategoryValue = this.activityForm.get('newCategory')?.value;

    if (categoryValue === 'nueva') {
      if (!newCategoryValue || newCategoryValue.trim().length < 3) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error en categoría',
          detail: 'La nueva categoría debe tener al menos 3 caracteres'
        });
        return false;
      }
    }

    return true;
  }

  private markFormGroupTouched() {
    Object.keys(this.activityForm.controls).forEach(key => {
      const control = this.activityForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.router.navigate(['/activities']);
  }

  getFieldError(fieldName: string): string {
    const field = this.activityForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'El título',
      category: 'La categoría',
      newCategory: 'La nueva categoría',
      description: 'La descripción',
      imageUrl: 'La imagen'
    };
    return labels[fieldName] || fieldName;
  }

  private generateChatbotContext(title: string, description: string, category: string): string {
    // Generar contexto inteligente combinando título, descripción y categoría
    const normalizedTitle = title.toLowerCase();
    const normalizedDescription = description.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    // Extraer palabras clave del título y descripción
    const keywords = [...normalizedTitle.split(' '), ...normalizedDescription.split(' ')]
      .filter(word => word.length > 3)
      .slice(0, 5); // Tomar las primeras 5 palabras significativas

    // Crear un contexto descriptivo
    let context = `actividad de ${normalizedCategory.toLowerCase()}`;

    if (keywords.length > 0) {
      context += ` relacionada con ${keywords.join(', ')}`;
    }

    // Agregar el título si es diferente a las palabras clave
    if (!keywords.includes(normalizedTitle)) {
      context += ` (${normalizedTitle})`;
    }

    console.log('Contexto generado para chatbot:', context);
    return context;
  }
}
