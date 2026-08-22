import { Injectable } from '@angular/core';
import {SupabaseClientService} from '@platform/supabase/supabase-client.service';
import {LOGGER_COLORS, LoggerService} from "@platform/logging/logger.service"
import {FileObject, StorageError} from "@supabase/storage-js"

@Injectable({
  providedIn: 'root'
})
export class SupabaseStorageService {

  constructor(private supabase: SupabaseClientService, private logger: LoggerService) {
    this.logger.setConfig(SupabaseStorageService.name, LOGGER_COLORS.API)
  }

  public uploadImage(path: string, file: File): Promise<{data: {id: string, path: string, fullPath: string}, error: null} | {data: null, error: StorageError}> {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        const byteArray = new Uint8Array(reader.result as ArrayBuffer)
        resolve(await this.supabase.client.storage
          .from(this.supabase.storageBucket)
          .upload(path, byteArray, {contentType: file.type, upsert: true}))
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  }

  public readImage(path: string): Promise<{data: Blob, error: null} | {data: null, error: StorageError}> {
    return this.supabase.client.storage.from(this.supabase.storageBucket).download(path)
  }

  public readImages(path: string): Promise<{data: FileObject[], error: null} | {data: null, error: StorageError}> {
    return this.supabase.client.storage.from(this.supabase.storageBucket).list(path)
  }

  public removeFiles(paths: string[]): Promise<{data: FileObject[], error: null} | {data: null, error: StorageError}> {
    return this.supabase.client.storage.from(this.supabase.storageBucket).remove(paths)
  }

}
