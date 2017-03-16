import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { WakeResponse } from './wake-response';
import 'rxjs/Rx';

@Injectable()
export class WakeService {

  private URL: string = '/wake';

  subResponse: Subject<WakeResponse> = new Subject();

  constructor(private http: Http) { }

  wake(computer: number, password: string) {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(this.URL, { computer, password }).map(this.extractData);
  }

  private extractData(res: Response) {
    let body = res.json();
    return new WakeResponse(res.status, body.message);
  }

}