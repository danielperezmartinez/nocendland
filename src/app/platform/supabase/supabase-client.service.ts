import {Injectable} from '@angular/core';
import {createClient} from '@supabase/supabase-js';
import {environment} from '@environments/environment';
import {Database} from './database.types';

@Injectable({providedIn: 'root'})
export class SupabaseClientService {
  readonly client = createClient<Database>(environment.supabaseUrl, environment.supabaseKey, {
    db: {schema: 'nocendland'},
    // El callback realiza el intercambio una sola vez, después de INITIAL_SESSION.
    auth: {flowType: 'pkce', detectSessionInUrl: false},
  })
  readonly storageBucket = 'nocendland'
}
