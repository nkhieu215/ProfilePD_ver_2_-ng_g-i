import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { IThietBi } from 'app/entities/thiet-bi/thiet-bi.model';
import { Component, Input, OnInit } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';

import { IKichBan, KichBan } from '../kich-ban.model';
import { KichBanService } from '../service/kich-ban.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IChiTietKichBan } from 'app/entities/chi-tiet-kich-ban/chi-tiet-kich-ban.model';
import { IQuanLyThongSo } from 'app/entities/quan-ly-thong-so/quan-ly-thong-so.model';

@Component({
  selector: 'jhi-kich-ban-update',
  templateUrl: './kich-ban-update.component.html',
  styleUrls: ['./kich-ban-update.component.css'],
})
export class KichBanUpdateComponent implements OnInit {
  //==============================================           URL          ================================
  //------------------- url lay danh sach thong so theo ma thiet bi --------------------
  thietBiUrl = this.applicationConfigService.getEndpointFor('api/thiet-bi/danh-sach-thong-so-thiet-bi');
  // ----------------- url luu thong so kich ban theo ma thiet bi -----------------------
  chiTietKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban/them-moi-thong-so-kich-ban');
  listThongSoUrl = this.applicationConfigService.getEndpointFor('api/quan-ly-thong-so');
  listThietBiUrl = this.applicationConfigService.getEndpointFor('api/thiet-bi');
  listNhomThietBiUrl = this.applicationConfigService.getEndpointFor('api/nhom-thiet-bi');
  getChiTietKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban/thong-so-kich-ban');
  putChiTietKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban/cap-nhat-thong-so-kich-ban');
  donViUrl = this.applicationConfigService.getEndpointFor('api/don-vi');
  listKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban');
  listDayChuyenUrl = this.applicationConfigService.getEndpointFor('api/day-chuyen');
  delThongSoKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban/del-thong-so-kich-ban');

  //-------------------------------------------------------------------------------
  isSaving = false;
  predicate!: string;
  ascending!: boolean;

  dropdownList: IKichBan[] = [];
  @Input() selectedItems: { maThietBi: string }[] = [];
  dropdownSettings = {};

  onSelectItemRequest: string[] = [];

  account: Account | null = null;

  public showSuccessPopupService = false;
  public showSuccessPopup = false;

  result?: string;
  resultThongSo?: string;

  //--------------------------------------------- khoi tao input thong so kich ban
  @Input() thongSo = '';
  @Input() minValue = 0;
  @Input() maxValue = 0;
  @Input() trungBinh = 0;
  @Input() donVi = '';
  @Input() phanLoai = '';
  @Input() dayChuyen = '';
  @Input() maThietBi?: string | null | undefined = '';
  @Input() maSanPham = '';
  @Input() versionSanPham = '';
  // dayChuyen: string | null | undefined = '';
  // maSanPham: string | null | undefined = '';
  // versionSanPham: string | null | undefined = '';
  //----------------------------------------- khoi tao input kich ban
  idKichBan: number | null | undefined;
  maKichBan: string | null | undefined;
  @Input() trangThai = '';
  thietBisSharedCollection: IThietBi[] = [];
  kichBansSharedCollection: IKichBan[] = [];
  //------------------ nơi lưu danh sách thông số - danh sách thiết bị --------------------
  listOfThongSo: IQuanLyThongSo[] = [];
  listOfThietBi: IThietBi[] = [];
  listNhomThietBi: { loaiThietBi: string; maThietBi: string; dayChuyen: string }[] = [];
  listDonVi: { donVi: string }[] = [];
  // ------------------ lưu tìm kiếm theo Nhóm thiết bị ---------------
  listMaThietBi: { maThietBi: string }[] = [];
  listLoaiThietBi: { loaiThietBi: string }[] = [];
  listKichBan: IKichBan[] = [];
  listDayChuyen: { dayChuyen: string }[] = [];
  //---------------------------------------------------
  form!: FormGroup;
  listOfChiTietKichBan: {
    id: number;
    idKichBan: number | null | undefined;
    maKichBan: string | null | undefined;
    thongSo: string | null | undefined;
    minValue: number;
    maxValue: number;
    trungbinh: number;
    donVi: string;
    phanLoai: string | null | undefined;
  }[] = [];

  editForm = this.fb.group({
    id: [],
    maKichBan: [],
    maThietBi: [],
    loaiThietBi: [],
    dayChuyen: [],
    maSanPham: [],
    versionSanPham: [],
    ngayTao: [],
    timeUpdate: [],
    updateBy: [],
    trangThai: [],
  });

  readonly destroy$ = new Subject<void>();

  selectedStatus = 'active';

  constructor(
    protected kichBanService: KichBanService,
    protected activatedRoute: ActivatedRoute,
    protected fb: FormBuilder,
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
    protected accountService: AccountService
  ) {
    this.form = this.fb.group({
      maKichBan: null,
      tenKichBan: null,
      maThietBi: null,
      loaiThietBi: null,
      maSanPham: null,
      verSanPham: null,
    });
  }

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => {
      this.account = account;
    });
    this.activatedRoute.data.subscribe(({ kichBan }) => {
      this.getAllThongSo();
      this.getAllThietBi();
      this.getAllNhomThietBi();
      this.getAllDonVi();
      this.getAllKichBan();
      // lay danh sach nhom thiet bi
      this.http.get<any>(this.listNhomThietBiUrl).subscribe(res1 => {
        this.listNhomThietBi = res1;
        if (kichBan.id === undefined) {
          this.editForm.patchValue({ id: undefined });
          const today = dayjs().startOf('day');
          kichBan.ngayTao = today;
          kichBan.timeUpdate = today;
        } else {
          //Lấy danh sách thông số thiết bị theo id
          this.http.get<any>(`${this.getChiTietKichBanUrl}/${kichBan.id as number}`).subscribe(res => {
            this.listOfChiTietKichBan = res;
            //gán idThietBi cho list
            for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
              this.listOfChiTietKichBan[i].idKichBan = kichBan.id;
            }
          });
          // lay danh sach ma thiet bi theo kichban.loaithietbi
          for (let i = 0; i < this.listNhomThietBi.length; i++) {
            if (kichBan.loaiThietBi === this.listNhomThietBi[i].loaiThietBi) {
              const items = { maThietBi: this.listNhomThietBi[i].maThietBi };
              this.listMaThietBi.push(items);
            }
          }
          console.log('maTB:', this.listMaThietBi);
          console.log('maTB2222:', this.listNhomThietBi);
          // gan gia tri cho onselectItemRequest
          console.log((this.onSelectItemRequest = kichBan.maThietBi.split(',')));
          // gán vào selectItem
          for (let i = 0; i < this.onSelectItemRequest.length; i++) {
            // tạo 1 biến chứa value tại vị trí i
            const item: { maThietBi: string } = { maThietBi: this.onSelectItemRequest[i] };
            this.selectedItems.push(item);
          }
          console.log(this.selectedItems);
          console.log('thong so kich ban:', this.listOfChiTietKichBan);
          // console.log('ma thiet bi: ', this.editForm.get(['maThietBi'])!.value);
          console.log('ma thiet bi', this.listMaThietBi);
        }
      });
      this.updateForm(kichBan);
    });

    this.dropdownSettings = {
      singleSelection: false,
      idField: 'maThietBi',
      textField: 'maThietBi',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }
  //
  onItemSelect(item: any): void {
    this.onSelectItemRequest = [];
    // tao item1 va gan value = item
    // const item1: { maThietBi: string } = item;
    // this.selectedItems.push(item1);
    // this.onSelectItemRequest.push(item1.maThietBi);

    for (let i = 0; i < this.selectedItems.length; i++) {
      this.onSelectItemRequest.push(this.selectedItems[i].maThietBi);
    }

    console.log(this.selectedItems);
    console.log(this.onSelectItemRequest);
  }
  onSelectAll(items: any): void {
    console.log(items);
    this.selectedItems = items;
    this.onSelectItemRequest = [];
    for (let i = 0; i < this.selectedItems.length; i++) {
      this.onSelectItemRequest.push(this.selectedItems[i].maThietBi);
    }

    console.log(this.selectedItems);
    console.log(this.onSelectItemRequest);
  }

  //==================================================== Lấy danh sách =================================================
  getAllThongSo(): void {
    this.http.get<IQuanLyThongSo>(this.listThongSoUrl).subscribe(res => {
      this.listOfThongSo = res as any;
      // console.log("danh sach thong so: ", this.listOfThongSo);
    });
  }
  getAllThietBi(): void {
    this.http.get<IThietBi>(this.listThietBiUrl).subscribe(res => {
      this.listOfThietBi = res as any;
      // console.log("danh sach thiet bi: ", this.listOfThietBi);
    });
  }
  getAllKichBan(): void {
    this.http.get<any>(this.listKichBanUrl).subscribe(data => {
      this.listKichBan = data;
    });
  }
  getAllNhomThietBi(): void {
    this.http.get<any>(this.listNhomThietBiUrl).subscribe(res => {
      this.listNhomThietBi = res;
      this.listNhomThietBi.sort((a, b) => a.loaiThietBi.localeCompare(b.loaiThietBi));
      // console.log("nhom thiet bi:", this.listNhomThietBi);
      const item = { loaiThietBi: this.listNhomThietBi[0].loaiThietBi };
      this.listLoaiThietBi.push(item);
      // console.log('loai thiet bi:', this.listLoaiThietBi);
      for (let i = 1; i < this.listNhomThietBi.length; i++) {
        if (this.listNhomThietBi[i].loaiThietBi !== this.listNhomThietBi[i - 1].loaiThietBi) {
          const items = { loaiThietBi: this.listNhomThietBi[i].loaiThietBi };
          this.listLoaiThietBi.push(items);
        } else {
          continue;
        }
      }
      // console.log('loai thiet bi:', this.listNhomThietBi);
    });
  }
  getAllDonVi(): void {
    this.http.get<any>(this.donViUrl).subscribe(res => {
      this.listDonVi = res;
      // console.log('don vi:', this.listDonVi);
    });
  }
  getMaThietBi(): void {
    //---------------------------------- Set thông tin tương ứng theo Nhóm thiết bị-----------------------------
    this.listMaThietBi = [];
    for (let i = 0; i < this.listNhomThietBi.length; i++) {
      if (this.editForm.get(['loaiThietBi'])!.value === this.listNhomThietBi[i].loaiThietBi) {
        const items = { maThietBi: this.listNhomThietBi[i].maThietBi };
        this.listMaThietBi.push(items);
      }
    }
    this.getThietBi();
    console.log('ma thiet bi:', this.listMaThietBi);
  }
  getAllDayChuyen(): void {
    this.http.get<any>(this.listDayChuyenUrl).subscribe(res => {
      this.listDayChuyen = res;
      // console.log("day chuyen:", this.listDayChuyen)
    });
  }
  //------------------------------ lay thong tin thiet bi thong qua loai thiet bi ------------------------------
  getThietBi(): void {
    this.listOfChiTietKichBan = [];
    const timKiem = {
      maThietBi: this.editForm.get(['maThietBi'])!.value,
      loaiThietBi: this.editForm.get(['loaiThietBi'])!.value,
      hangTms: '',
      thongSo: '',
      moTa: '',
      status: '',
      phanLoai: '',
    };
    // đây là api request về db để lấy chi tiết kịch bản, đọc kĩ thằng này rồi copy sang bên kia
    this.http.post<IChiTietKichBan[]>(this.thietBiUrl, timKiem).subscribe((res: IChiTietKichBan[]) => {
      // khoi tao danh sach
      for (let i = 0; i < res.length; i++) {
        const newRows: {
          id: number;
          idKichBan: number | null | undefined;
          maKichBan: string;
          thongSo: string | null | undefined;
          minValue: number;
          maxValue: number;
          trungbinh: number;
          donVi: string;
          phanLoai: string | null | undefined;
        } = {
          id: 0,
          idKichBan: undefined,
          maKichBan: '',
          thongSo: res[i].thongSo,
          minValue: 0,
          maxValue: 0,
          trungbinh: 0,
          donVi: '',
          phanLoai: res[i].phanLoai,
        };
        this.listOfChiTietKichBan.push(newRows);
      }
      console.log('thiet bi: ', this.listOfChiTietKichBan);
      console.log('tim kiem: ', timKiem);
    });
    //set dây chuyền tương ứng theo mã thiết bị
    for (let i = 0; i < this.listNhomThietBi.length; i++) {
      if (this.maThietBi === this.listNhomThietBi[i].maThietBi) {
        this.dayChuyen = this.listNhomThietBi[i].dayChuyen;
      }
    }
    // console.log('thiet bi: ', res;
    // console.log('tim kiem: ', timKiem);
  }
  //---------------------------------- ------------------------ -----------------------------

  previousState(): void {
    window.history.back();
  }

  trackThietBiById(_index: number, item: IThietBi): number {
    return item.id!;
  }

  save(): void {
    this.isSaving = true;
    const kichBan = this.createFromForm();
    if (kichBan.id !== undefined) {
      this.showSuccessPopupService = false;
      this.subscribeToSaveResponse(this.kichBanService.update(kichBan));
    } else {
      //kiem tra kich ban đã tồn tại hay chưa
      let result = true;
      for (let i = 0; i < this.listKichBan.length; i++) {
        if (this.editForm.get(['maKichBan'])!.value === this.listKichBan[i].maKichBan) {
          result = false;
          break;
        }
      }
      //check kết quả
      if (result === false) {
        // alert('Kịch bản đã tồn tại \n Vui lòng đặt tên kịch bản khác');
        window.location.reload();
      } else {
        // alert('Tạo mới kịch bản thành công');
        this.showSuccessPopupService = false;
        this.subscribeToCreateResponse(this.kichBanService.create(kichBan));
        console.log('kb', kichBan);
      }
    }
    console.log('id kich ban', kichBan.id);
    console.log('chi tiet kich ban:', this.listOfChiTietKichBan);
  }

  //---------------------------- luu thong so kich ban chi tiet ---------------------------
  saveChiTietKichBan(): void {
    if (this.listOfChiTietKichBan[1].idKichBan === 0) {
      // ------------ cập nhật kich_ban_id trong table chi tiết kịch bản -------------
      this.previousState();
    } else {
      console.log('cap nhat', this.listOfChiTietKichBan);
      this.previousState();
    }
  }
  // lấy id kịch bản
  subscribeToCreateResponse(result: Observable<HttpResponse<IKichBan>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(res => {
      console.log(res.body);
      // gán id kịch bản, mã kịch bản vào list chi tiết kịch bản request
      this.idKichBan = res.body?.id as any;
      this.maKichBan = res.body?.maKichBan as any;
      console.log('gan id kich ban: ', this.idKichBan);
      console.log('gan ma kich ban: ', this.maKichBan);
    });
  }
  subscribeToSaveResponse(result: Observable<HttpResponse<IKichBan>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  onSaveSuccess(): void {
    // this.previousState();
  }

  onSaveError(): void {
    // Api for inheritance.
  }

  onSaveFinalize(): void {
    this.isSaving = false;
  }

  openSuccessPopupService(): void {
    console.log('aaa', this.editForm.get(['id'])!.value);
    if (this.editForm.get(['id'])!.value !== undefined) {
      this.result = 'Cập nhật kịch bản thành công';
      this.showSuccessPopupService = true;
    } else {
      let result = true;
      for (let i = 0; i < this.listKichBan.length; i++) {
        if (this.editForm.get(['maKichBan'])!.value === this.listKichBan[i].maKichBan) {
          result = false;
          break;
        }
      }
      if (result === false) {
        // alert('Kịch bản đã tồn tại \n Vui lòng đặt tên kịch bản khác');
        this.result = 'Kịch bản đã tồn tại \n Vui lòng đặt tên kịch bản khác';
        this.showSuccessPopupService = true;
        window.location.reload();
      } else {
        this.result = 'Tạo mới kịch bản thành công';
        this.showSuccessPopupService = true;
      }
    }
  }
  closeSuccessPopupService(): void {
    this.showSuccessPopupService = false;
  }

  openSuccessPopup(): void {
    this.showSuccessPopup = true;
    console.log('idkb', this.listOfChiTietKichBan[1].idKichBan);
    if (this.listOfChiTietKichBan[1].idKichBan === undefined) {
      for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
        this.listOfChiTietKichBan[i].idKichBan = this.idKichBan;
        this.listOfChiTietKichBan[i].maKichBan = this.maKichBan;
      }
      this.http.post<any>(this.chiTietKichBanUrl, this.listOfChiTietKichBan).subscribe(() => {
        this.resultThongSo = 'Thêm mới chi tiết kịch bản thành công';
      });
    } else {
      this.http.put<any>(this.putChiTietKichBanUrl, this.listOfChiTietKichBan).subscribe(() => {
        this.resultThongSo = 'Cập nhật chi tiết kịch bản thành công';
      });
    }
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  updateForm(kichBan: IKichBan): void {
    this.editForm.patchValue({
      id: kichBan.id,
      maKichBan: kichBan.maKichBan,
      maThietBi: kichBan.maThietBi,
      loaiThietBi: kichBan.loaiThietBi,
      dayChuyen: kichBan.dayChuyen,
      maSanPham: kichBan.maSanPham,
      versionSanPham: kichBan.versionSanPham,
      ngayTao: kichBan.ngayTao ? kichBan.ngayTao.format(DATE_TIME_FORMAT) : null,
      timeUpdate: kichBan.timeUpdate ? kichBan.timeUpdate.format(DATE_TIME_FORMAT) : null,
      updateBy: kichBan.updateBy,
      trangThai: kichBan.trangThai,
      signal: kichBan.signal,
    });
  }

  trackId(_index: number, item: IChiTietKichBan): number {
    return item.id!;
  }

  createFromForm(): IKichBan {
    return {
      ...new KichBan(),
      id: this.editForm.get(['id'])!.value,
      maKichBan: this.editForm.get(['maKichBan'])!.value,
      maThietBi: this.onSelectItemRequest.toString(),
      loaiThietBi: this.editForm.get(['loaiThietBi'])!.value,
      dayChuyen: this.dayChuyen,
      maSanPham: this.maSanPham,
      versionSanPham: this.versionSanPham,
      ngayTao: this.editForm.get(['ngayTao'])!.value ? dayjs(this.editForm.get(['ngayTao'])!.value, DATE_TIME_FORMAT) : undefined,
      timeUpdate: this.editForm.get(['timeUpdate'])!.value ? dayjs(this.editForm.get(['timeUpdate'])!.value, DATE_TIME_FORMAT) : undefined,
      updateBy: this.account?.login,
      trangThai: this.editForm.get(['trangThai'])!.value,
      signal: 1,
    };
  }
  //----------------------------------------- them moi chi tiet kich ban --------------------------
  addRowThongSoKichBan(): void {
    const newRow = {
      id: 0,
      idKichBan: this.editForm.get(['id'])!.value,
      maKichBan: this.editForm.get(['maKichBan'])!.value,
      thongSo: '',
      minValue: 0,
      maxValue: 0,
      trungbinh: 0,
      donVi: '',
      phanLoai: '',
    };
    this.listOfChiTietKichBan.push(newRow);
    console.log('add row', this.listOfChiTietKichBan);
  }

  // sua lai xoa theo stt va ma thong so (id )
  deleteRow(thongSo: string | null | undefined, id: number | null | undefined): void {
    const kichBan = this.createFromForm();
    console.log('kich ban id:', kichBan.id);
    if (kichBan.id !== undefined) {
      if (confirm('Bạn chắc chắn muốn xóa thông số này?') === true) {
        this.http.delete(`${this.delThongSoKichBanUrl}/${id as number}`).subscribe(() => {
          // alert('Xóa thông số thành công !');
        });
        this.listOfChiTietKichBan = this.listOfChiTietKichBan.filter(d => d.thongSo !== thongSo);
      }
    } else {
      this.listOfChiTietKichBan = this.listOfChiTietKichBan.filter(d => d.thongSo !== thongSo);
    }
  }
}
