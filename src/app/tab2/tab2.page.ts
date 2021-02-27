import { Component, OnInit } from '@angular/core';
import { PhotoService, Photo } from './../services/photo.service';
import { ActionSheetController } from '@ionic/angular'

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  providers: [PhotoService]
})
export class Tab2Page implements OnInit{

  constructor(
    public photoService: PhotoService,
    private actionSheetController: ActionSheetController,
  ) {}

  ngOnInit() {
    this.photoService.loadPhotos();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery();
  }

  async showActionSheet(photo: Photo, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Are you sure to delete this photo?',
      buttons: [{
        text: 'Delete',
        role: 'Destructive',
        icon: 'trash',
        handler: () => {
           this.photoService.deletePhoto(photo, position);
        }
      }, {
        text: 'Cancel',
        role: 'cancel',
        icon: 'close',
        handler: () => {}
      }]
    });

    await actionSheet.present();
  }
}
