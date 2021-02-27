import { Injectable } from '@angular/core';
import {
  Plugins,
  FilesystemDirectory,
  CameraSource,
  CameraResultType,
  Capacitor,
  CameraPhoto
} from '@capacitor/core'
import { Platform } from '@ionic/angular';

const { Camera, Filesystem, Storage } = Plugins;

export interface Photo {
  filePath: string,
  webViewPath: string
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photo: Photo[];
  private PHOTO_MY_GALLERY: string;
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
    this.photo = [];
    this.PHOTO_MY_GALLERY = 'my gallery photos';
  }

  async loadPhotos() {
    const photoList = await Storage.get({
      key: this.PHOTO_MY_GALLERY
    });

    this.photo = JSON.parse(photoList.value) || [];

    // La forma más fácil de detectar cuando se ejecuta en la web:
   // "cuando la plataforma NO sea híbrida, haz esto"
   if(!this.platform.is('hybrid')){
     // Muestra la foto leyendo en formato base64
     for (let photo of this.photo) {
      // Leer los datos de cada foto guardada del sistema de archivos
       const readFile = await Filesystem.readFile({
         path: photo.filePath,
         directory: FilesystemDirectory.Data
       });

       // Solo plataforma web: carga la foto como datos base64
       photo.webViewPath = `data:image/jpeg;base64,${readFile.data}`;
     }
   }
  }

  async addNewToGallery() {

    try {

      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100
      });

      const savedPicture = await this.savedPicture(capturedPhoto);

      this.photo.push(savedPicture);

      Storage.set({
        key: this.PHOTO_MY_GALLERY,
        value: JSON.stringify(this.photo)
      });

    } catch (error) {
      console.log(error);
      this.photo = [];
    }
  }

  private async savedPicture(cameraPhoto: CameraPhoto) {

    const formatBase64 = await this.readAsBase64(cameraPhoto);

    const fileName = `${new Date().getTime()}.jpeg`;
    const fileSystem = await Filesystem.writeFile({
      path: fileName,
      data: formatBase64,
      directory: FilesystemDirectory.Data
    });

    if(this.platform.is('hybrid')){
      return {
        //mandarle la nueva imagen sobreescrita en el path 'file://' del http
        filePath: fileSystem.uri,
        webViewPath: Capacitor.convertFileSrc(fileSystem.uri)
      }
    }else{

      //Use webPath para mostrar la nueva imagen en lugar de base64 ya que es
      // ya cargado en la memoria
      return {
        filePath: fileName,
        webViewPath: cameraPhoto.webPath
      }

    }

  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    //hybrid lo detectara cordova o capacitor
    if(this.platform.is('hybrid')){

      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });

      return file.data;
    }else{

      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();

      return await this.convertToBase64(blob) as string;
    }
  }

  private convertToBase64(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      //FileReader se encarga de formatear el blob a base64
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      }
      reader.readAsDataURL(blob);
    });
  }
}
