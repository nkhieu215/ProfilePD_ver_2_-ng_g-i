import { HttpClient } from '@angular/common/http';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IChiTietLenhSanXuat } from 'app/entities/chi-tiet-lenh-san-xuat/chi-tiet-lenh-san-xuat.model';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ILenhSanXuat } from '../lenh-san-xuat.model';

@Component({
  selector: 'jhi-lenh-san-xuat-detail',
  templateUrl: './lenh-san-xuat-detail.component.html',
})
export class LenhSanXuatDetailComponent implements OnInit {
  resourceUrl = this.applicationConfigService.getEndpointFor('/api/chi-tiet-lenh-san-xuats');
  lenhSanXuat: ILenhSanXuat | null = null;
  chiTietLenhSanXuats: IChiTietLenhSanXuat[] | null = [];
  predicate!: string;
  ascending!: boolean;

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected applicationConfigService: ApplicationConfigService,
    protected http: HttpClient) { }

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ lenhSanXuat }) => {
      this.lenhSanXuat = lenhSanXuat;
    });
    if (this.lenhSanXuat?.id) {
      this.http.get<any>(`${this.resourceUrl}/${this.lenhSanXuat.id}`).subscribe(res => {
        this.chiTietLenhSanXuats = res;
        console.log('res', res);
        console.log('lenhSanXuat', this.chiTietLenhSanXuats)
      })
    }
  }

  previousState(): void {
    window.history.back();
  }
}
