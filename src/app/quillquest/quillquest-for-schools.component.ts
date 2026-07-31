import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';

@Component({
  selector: 'app-quillquest-for-schools',
  imports: [QuillquestShellComponent, RouterLink],
  templateUrl: './quillquest-for-schools.component.html',
  styleUrl: './doc.scss',
})
export class QuillquestForSchoolsComponent {}
