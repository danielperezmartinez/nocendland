import {Injectable} from '@angular/core';
import {createClient} from '@supabase/supabase-js';
import {environment} from '@environments/environment';
import {Database} from './database.types';

@Injectable({providedIn: 'root'})
export class SupabaseClientService {
  readonly client = createClient<Database>(environment.supabaseUrl, environment.supabaseKey)
  readonly storageBucket = 'nocendland'
}
