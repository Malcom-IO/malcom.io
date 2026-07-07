import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';

@Component({
  selector: 'app-quillquest-privacy',
  imports: [QuillquestShellComponent, RouterLink],
  templateUrl: './quillquest-privacy.component.html',
  styleUrl: './doc.scss',
})
export class QuillquestPrivacyComponent {}
