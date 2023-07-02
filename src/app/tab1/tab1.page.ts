import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { AlertController, IonModal } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core/components';


@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  // @ViewChild(IonModal) modal!: IonModal;

  speechText: string = "";
  isRecording: boolean = false;
  isSpeaking: boolean = false;
  answer: string = '';
  canFinishTest: boolean = false;
  isScoreCalc: boolean = false;

  langOption: string = '';

  currentQuestionIndex: number = 0;
  currentAnswerIndex: number = 0;
  allAnswers: any[] = [];
  allQuestions: any[] = [];

  questions: string[] = ['Bugün günlerden ne?', 'Bu yazı hangi renk?', 'Şu an hangi mevsimdeyiz?', 'Şu an neredesin?', 'Kaç yaşındasın?'];
  correctAnswers: string[] = ['gün', 'renk', 'mevsim', 'ev', 'yaş'];

  maxScore: number = this.correctAnswers.length;
  score: number = 0;

  items: any[] = [];
  testFinished: boolean = false;
  analyseList: any[] = [];

  isScoreModalOpen: boolean = false;
  patient: any = { name: 'TestNam', surname: 'TestSur', age: '24', birtdate: { day: '11', month: '11', year: '1975' }, sex: 'kadın', score: '', testId: '', testDate: '', duration: '' }
  isPatientRegisterationModalOpen: boolean = true;

  patientRegisterationForm!: FormGroup;

  constructor(private alertController: AlertController, private platform: Platform, private formBuilder: FormBuilder) {
    SpeechRecognition.requestPermissions();
    // Example usage
    if (this.platform.is('ios')) {
      // Code for iOS platform
      console.log('Running on iOS');
      this.langOption = 'Leyla';
      this.patientRegisterationForm = this.formBuilder.group({
        day: ['', [Validators.required, Validators.min(1), Validators.max(31)]]
      });  
    } else if (this.platform.is('android')) {
      // Code for Android platform
      console.log('Running on Android');
      this.langOption = 'tr-TR';
    } else {
      // Code for other platforms
      console.log('Running on PC');
      this.langOption = 'tr-TR';
      this.patientRegisterationForm = this.formBuilder.group({
        day: ['', [Validators.required, Validators.min(1), Validators.max(31)]]
      });  
    }
  }

  async startRecognition() {

    const available = await SpeechRecognition.available();

    if (available) {
      this.isRecording = true;
      await SpeechRecognition.start({
        popup: false,
        partialResults: true,
        language: "tr-TR",
      });

      SpeechRecognition.addListener('partialResults', (data: any) => {
        console.log('partial results was fired!', data.matches);
        if (data.matches && data.matches.length > 0) {
          this.answer = data.matches[0];
          this.allAnswers = data
        }
      });

    } else {
      await this.presentAlert('Voice recognition is not availabe.');
    }
  }

  async stopRecognition() {
    this.isRecording = false;
    await SpeechRecognition.stop();
  }

  ngOnInit() {
  }

  async speakText(sentence: string) {
    this.isSpeaking = true;
    await TextToSpeech.speak({
      text: sentence,
      lang: 'tr-TR',
      rate: 0.75,
      pitch: 1.25,
      volume: 1.0
    });

    setTimeout(async () => {
      await this.stopSpeaking();
    }, 1750);
  }

  async stopSpeaking() {
    this.isSpeaking = false;
    await TextToSpeech.stop();
  }

  async presentAlert(msg: string) {
    const alert = await this.alertController.create({
      header: 'Bildirim',
      subHeader: msg,
      buttons: ['Tamam'],
    });
    await alert.present();
  }

  skipNextQuestion() {

  }

  skipPrevQuestion() {

  }

  completeAnswer() {
    if (this.currentQuestionIndex === this.questions.length) {
      this.canFinishTest = true;
      var answer = { type: 'answer', content: this.answer, index: this.currentAnswerIndex };
      this.items.push(answer);
      this.answer = '';
      this.stopRecognition()
    } else {
      var answer = { type: 'answer', content: this.answer, index: this.currentAnswerIndex };
      this.items.push(answer);
      var question = { type: 'question', content: this.questions[this.currentQuestionIndex], index: this.currentAnswerIndex };
      this.items.push(question);
      this.currentQuestionIndex++;
      this.currentAnswerIndex++;
      this.answer = '';
      this.stopRecognition();
    }
  }

  completeTest() {
    //calc score & open score model 
    this.calcScore();
    this.isScoreModalOpen = true;
  }

  calcScore() {
    this.allAnswers = this.items.filter((item: any) => item.type === 'answer');
    console.log(this.allAnswers);

    for (let index = 0; index < this.allAnswers.length; index++) {
      if (this.allAnswers[index].content.toLowerCase() === this.correctAnswers[index].toLowerCase()) {
        this.score += 1;
        var analyse = { answer: this.allAnswers[index].content, correctAnswer: this.correctAnswers[index], scoreGain: 1 };
      } else if (this.allAnswers[index].content.toLowerCase().includes(this.correctAnswers[index])) {
        this.score += .5;
        var analyse = { answer: this.allAnswers[index].content, correctAnswer: this.correctAnswers[index], scoreGain: .5 };
      } else {
        var analyse = { answer: this.allAnswers[index].content, correctAnswer: this.correctAnswers[index], scoreGain: 0 };
      }
      this.analyseList.push(analyse);
      this.isScoreCalc = true;
    }
  }

  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;    
    console.log(ev);
  }

  setOpen(condition: boolean) {
    this.isScoreModalOpen = condition;
  }

  completePatientRegisteration() {
    this.isPatientRegisterationModalOpen = false;
    var question = { type: 'question', content: this.questions[this.currentQuestionIndex], index: this.currentQuestionIndex };
    this.items.push(question);
    this.currentQuestionIndex++;
  }
}