import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuillquestShellComponent } from './quillquest-shell.component';
import { QUILLQUEST_FAQS } from './quillquest-faqs';

@Component({
  selector: 'app-quillquest-support',
  imports: [QuillquestShellComponent, RouterLink],
  templateUrl: './quillquest-support.component.html',
  styleUrl: './doc.scss',
})
export class QuillquestSupportComponent {
  readonly faqs = QUILLQUEST_FAQS;
}
