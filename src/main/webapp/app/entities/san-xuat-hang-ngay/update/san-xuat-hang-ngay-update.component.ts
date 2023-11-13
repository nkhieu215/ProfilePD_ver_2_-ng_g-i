import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { IChiTietKichBan } from 'app/entities/chi-tiet-kich-ban/chi-tiet-kich-ban.model';
import { IThietBi } from 'app/entities/thiet-bi/thiet-bi.model';
import { Component, Input, OnInit } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';

import { ISanXuatHangNgay, SanXuatHangNgay } from '../san-xuat-hang-ngay.model';
import { SanXuatHangNgayService } from '../service/san-xuat-hang-ngay.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IKichBan } from 'app/entities/kich-ban/kich-ban.model';
import { IQuanLyThongSo } from 'app/entities/quan-ly-thong-so/quan-ly-thong-so.model';

@Component({
  selector: 'jhi-san-xuat-hang-ngay-update',
  templateUrl: './san-xuat-hang-ngay-update.component.html',
  styleUrls: ['./san-xuat-hang-ngay-update.component.css'],
})
export class SanXuatHangNgayUpdateComponent implements OnInit {
  //------------------- url lay danh sach thong so theo mã kịch bản --------------------
  kichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban/thong-so-kich-ban/ma-kich-ban');
  // ----------------- url luu thong so kich ban theo mã kịch bản -----------------------
  chiTietSanXuatUrl = this.applicationConfigService.getEndpointFor('api/san-xuat-hang-ngay/them-moi-thong-so-san-xuat');
  // ------------------- url lay thong tin kich ban theo ma kich ban ----------------------
  kichBanUrl1 = this.applicationConfigService.getEndpointFor('api/kich-ban/chi-tiet-kich-ban-ma-kich-ban');
  listThongSoUrl = this.applicationConfigService.getEndpointFor('api/quan-ly-thong-so');
  listThietBiUrl = this.applicationConfigService.getEndpointFor('api/thiet-bi');
  listNhomThietBiUrl = this.applicationConfigService.getEndpointFor('api/nhom-thiet-bi');
  getChiTietSanXuatUrl = this.applicationConfigService.getEndpointFor('api/san-xuat-hang-ngay/chi-tiet-san-xuat');
  putChiTietSanXuatUrl = this.applicationConfigService.getEndpointFor('api/san-xuat-hang-ngay/cap-nhat');
  donViUrl = this.applicationConfigService.getEndpointFor('api/don-vi');
  getKichBanUrl = this.applicationConfigService.getEndpointFor('api/kich-ban');
  listDayChuyenUrl = this.applicationConfigService.getEndpointFor('api/day-chuyen');
  delUrl = this.applicationConfigService.getEndpointFor('api/san-xuat-hang-ngay/del-thong-so');
  changeSignalUrl = this.applicationConfigService.getEndpointFor('api/san-xuat-hang-ngay');

  selectedStatus = 'active';

  isSaving = false;
  predicate!: string;
  ascending!: boolean;
  isSignalChange = false;
  dropdownList: IKichBan[] = [];
  @Input() selectedItems: { maThietBi: string }[] = [];
  dropdownSettings = {};
  onSelectItemRequest: string[] = [];

  account: Account | null = null;

  public showSuccessPopupService = false;
  public showSuccessPopup = false;

  result?: string;
  resultThongSo?: string;
  // biến kiểm tra trạng thái thay đổi

  @Input() color = 'blue';

  //--------------------------------------------- khoi tao input thong so kich ban
  @Input() idKichBan = '';
  @Input() maKichBan = '';
  @Input() thongSo = '';
  @Input() minValue = '';
  @Input() maxValue = '';
  @Input() trungBinh = '';
  @Input() donVi = '';
  @Input() phanLoai = '';
  //----------------------------------------- khoi tao input kich ban sản xuất hàng ngày
  @Input() maThietBi?: string | null | undefined = '';
  @Input() loaiThietBi = '';
  @Input() dayChuyen?: string | null | undefined = '';
  @Input() maSanPham?: string | null | undefined = '';
  @Input() versionSanPham?: string | null | undefined = '';
  @Input() trangThai = '';
  idSanXuatHangNgay: number | null | undefined;
  thietBisSharedCollection: IThietBi[] = [];
  //------------------ nơi lưu danh sách thông số - danh sách thiết bị --------------------
  listOfThongSo: IQuanLyThongSo[] = [];
  listOfThietBi: IThietBi[] = [];
  listNhomThietBi: { loaiThietBi: string; maThietBi: string; dayChuyen: string }[] = [];
  listDonVi: { donVi: string }[] = [];
  listKichBan: { maKichBan: string }[] = [];

  // ------------------ lưu tìm kiếm theo Nhóm thiết bị ---------------
  listMaThietBi: { maThietBi: string }[] = [];
  listDayChuyen: { dayChuyen: string }[] = [];

  listOfChiTietKichBan: {
    id: number;
    idSanXuatHangNgay: number | null | undefined;
    maKichBan: string | null | undefined;
    thongSo: string | null | undefined;
    minValue: number | null | undefined;
    maxValue: number | null | undefined;
    trungbinh: number | null | undefined;
    donVi: string | null | undefined;
  }[] = [];
  originListOfChiTietKichBan: {
    id: number;
    idSanXuatHangNgay: number | null | undefined;
    maKichBan: string | null | undefined;
    thongSo: string | null | undefined;
    minValue: number | null | undefined;
    maxValue: number | null | undefined;
    trungbinh: number | null | undefined;
    donVi: string | null | undefined;
  }[] = [];
  editChiTietForm = this.fb.group({
    thongSo: '',
    minValue: '',
    maxValue: '',
    trungbinh: '',
    donVi: '',
  });
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
    trangThai: [],
  });

  constructor(
    protected sanXuatHangNgayService: SanXuatHangNgayService,
    protected activatedRoute: ActivatedRoute,
    protected fb: FormBuilder,
    protected http: HttpClient,
    protected applicationConfigService: ApplicationConfigService,
    protected accountService: AccountService
  ) {}

  ngOnInit(): void {
    this.accountService.identity().subscribe(account => {
      this.account = account;
    });
    this.activatedRoute.data.subscribe(({ sanXuatHangNgay }) => {
      this.getAllDonVi();
      this.getAllKichBan();
      this.getAllDayChuyen();
      this.getAllThongSo();
      this.getAllThietBi();
      this.getAllNhomThietBi();
      this.http.get<any>(this.listNhomThietBiUrl).subscribe(res1 => {
        this.listNhomThietBi = res1;
        if (sanXuatHangNgay.id === undefined) {
          const today = dayjs().startOf('minute');
          sanXuatHangNgay.ngayTao = today;
          sanXuatHangNgay.timeUpdate = today;
        } else {
          sessionStorage.setItem('ma thiet bi goc', sanXuatHangNgay.maThietBi);
          this.idSanXuatHangNgay = sanXuatHangNgay.id;
          this.maThietBi = sanXuatHangNgay.maThietBi;
          this.dayChuyen = sanXuatHangNgay.dayChuyen;
          this.maSanPham = sanXuatHangNgay.maSanPham;
          this.versionSanPham = sanXuatHangNgay.versionSanPham;
          this.loaiThietBi = sanXuatHangNgay.loaiThietBi;
          const today = dayjs().startOf('minute');
          sanXuatHangNgay.timeUpdate = today;
          //Lấy danh sách thông số thiết bị theo id
          this.http.get<any>(`${this.getChiTietSanXuatUrl}/${sanXuatHangNgay.id as number}`).subscribe(res => {
            this.listOfChiTietKichBan = res;
            console.log('res: ', res);
            //gán idThietBi cho list
            for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
              this.listOfChiTietKichBan[i].idSanXuatHangNgay = sanXuatHangNgay.id;
            }
            sessionStorage.setItem('kich ban goc', JSON.stringify(this.listOfChiTietKichBan));
            // console.log("san xuat hang ngay:", this.originListOfChiTietKichBan)
            console.log('id kich ban:', this.idSanXuatHangNgay);
          });
          this.getMaThietBi(sanXuatHangNgay.loaiThietBi, sanXuatHangNgay.maThietBi);
        }
        this.updateForm(sanXuatHangNgay);
      });
    });
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'maThietBi',
      textField: 'maThietBi',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true,
    };
  }

  onItemSelect(item: any): void {
    this.onSelectItemRequest = [];
    for (let i = 0; i < this.selectedItems.length; i++) {
      this.onSelectItemRequest.push(this.selectedItems[i].maThietBi);
    }
    console.log('selectitem', this.selectedItems);
    console.log('request', this.onSelectItemRequest);
    console.log('item', item);
  }
  public onDeSelect(item: any): void {
    this.onSelectItemRequest = [];
    for (let i = 0; i < this.selectedItems.length; i++) {
      this.onSelectItemRequest.push(this.selectedItems[i].maThietBi);
    }
    console.log(this.onSelectItemRequest);
  }
  onSelectAll(items: any): void {
    this.onSelectItemRequest = [];
    this.selectedItems = items;
    for (let i = 0; i < this.selectedItems.length; i++) {
      this.onSelectItemRequest.push(this.selectedItems[i].maThietBi);
    }
    console.log('selectitemAll', this.selectedItems);
    console.log('requestAll', this.onSelectItemRequest);
    console.log(items);
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
  getAllNhomThietBi(): void {
    this.http.get<any>(this.listNhomThietBiUrl).subscribe(res => {
      this.listNhomThietBi = res;
      // console.log('nhom thiet bi:', this.listNhomThietBi);
    });
  }
  getAllDonVi(): void {
    this.http.get<any>(this.donViUrl).subscribe(res => {
      this.listDonVi = res;
      // console.log("don vi:", this.listDonVi);
    });
  }
  getAllKichBan(): void {
    this.http.get<any>(this.getKichBanUrl).subscribe(res => {
      this.listKichBan = res;
      // console.log("kich ban:", this.listKichBan)
    });
  }
  getAllDayChuyen(): void {
    this.http.get<any>(this.listDayChuyenUrl).subscribe(res => {
      this.listDayChuyen = res;
      // console.log("day chuyen: ", this.listDayChuyen);
    });
  }

  getMaThietBi(loaiTB: string | undefined | null, maTB: string | undefined | null): void {
    this.listMaThietBi = [];
    // console.log('ma thiet bi:',this.listNhomThietBi)
    console.log('loai thiet bi', loaiTB);
    for (let i = 0; i < this.listNhomThietBi.length; i++) {
      if (loaiTB === this.listNhomThietBi[i].loaiThietBi) {
        const items = { maThietBi: this.listNhomThietBi[i].maThietBi };
        this.listMaThietBi.push(items);
      }
    }
    console.log(this.listMaThietBi);
    // gán vào selectItem
    if (maTB) {
      this.onSelectItemRequest = maTB.split(',');
      for (let i = 0; i < this.onSelectItemRequest.length; i++) {
        for (let j = 0; j < this.listMaThietBi.length; j++) {
          if (this.listMaThietBi[j].maThietBi === this.onSelectItemRequest[i]) {
            this.selectedItems = [...this.selectedItems, this.listMaThietBi[j]];
          }
        }
      }
      console.log('item log', this.selectedItems);
    }
  }

  //------------------------------ lay thong tin kịch bản, chi tiết kịch bản thông qua mã kịch bản ------------------------------
  getChiTietKichBan(): { maThietBi: string }[] {
    this.selectedItems = [];
    this.listOfChiTietKichBan = [];
    //---------- lay thong tin kich ban -------------
    this.http
      .get<IKichBan>(`${this.kichBanUrl1}/${this.editForm.get(['maKichBan'])!.value as number}`)
      .subscribe((res: ISanXuatHangNgay) => {
        if (res.maThietBi !== null && res.maThietBi !== undefined) {
          sessionStorage.setItem('ma thiet bi goc', res.maThietBi);
        }
        //---------------------------------- Set thông tin tương ứng theo Nhóm thiết bị-----------------------------
        //lay thong tin chi tiet kich ban
        // console.log('hello', this.listNhomThietBi);
        // set thông tin kịch bản để hiển thị
        this.dayChuyen = res.dayChuyen;
        this.maSanPham = res.maSanPham;
        this.versionSanPham = res.versionSanPham;
        // set thông tin kịch bản để thêm mới
        this.editForm.patchValue({
          maThietBi: res.maThietBi,
          loaiThietBi: res.loaiThietBi,
          dayChuyen: res.dayChuyen,
          maSanPham: res.maSanPham,
          versionSanPham: res.versionSanPham,
          trangThai: res.trangThai,
        });
        // console.log('lay ma thiet bi', res.maThietBi);
        // lấy danh sách mã thiết bị theo loại thiết bị
        this.getMaThietBi(res.loaiThietBi, res.maThietBi);
      });
    //lay thong tin chi tiet kich ban
    this.http.get<IChiTietKichBan[]>(`${this.kichBanUrl}/${this.editForm.get(['maKichBan'])!.value as number}`).subscribe(res => {
      for (let i = 0; i < res.length; i++) {
        const newRow = {
          id: 0,
          idSanXuatHangNgay: undefined,
          maKichBan: res[i].maKichBan,
          thongSo: res[i].thongSo,
          minValue: res[i].minValue,
          maxValue: res[i].maxValue,
          trungbinh: res[i].trungbinh,
          donVi: res[i].donVi,
        };
        this.listOfChiTietKichBan.push(newRow);
        // lưu trữ kịch bản gốc vào session
        sessionStorage.setItem('kich ban goc', JSON.stringify(this.listOfChiTietKichBan));
      }
      //bật chức năng lắng nghe sự thay đổi giá trị chi tiết kịch bản sản xuất
      console.log('select item: ', { all: this.listMaThietBi, selected: this.selectedItems });
    });
    return this.selectedItems;
  }

  //-------------------------- set Dây chuyền tương ứng theo mã thiết bị -------------------
  setDayChuyen(): void {
    for (let i = 0; i < this.listNhomThietBi.length; i++) {
      if (this.maThietBi === this.listNhomThietBi[i].maThietBi) {
        this.dayChuyen = this.listNhomThietBi[i].dayChuyen;
        console.log('day chuyen: ', this.dayChuyen);
      }
    }
    //  console.log("day chuyen: ", this.dayChuyen)
  }
  trackId(_index: number, item: IChiTietKichBan): number {
    return item.id!;
  }

  previousState(): void {
    window.history.back();
  }

  trackThietBiById(_index: number, item: IThietBi): number {
    return item.id!;
  }
  // ---------------------------- save ---------------------

  save(): void {
    this.isSaving = true;
    const sanXuatHangNgay = this.createFromForm();
    if (sanXuatHangNgay.id !== undefined) {
      this.idSanXuatHangNgay = sanXuatHangNgay.id;
      this.showSuccessPopupService = false;
      this.subscribeToSaveResponse(this.sanXuatHangNgayService.update(sanXuatHangNgay));
    } else {
      this.showSuccessPopupService = false;
      this.subscribeToCreateResponse(this.sanXuatHangNgayService.create(sanXuatHangNgay));
    }
  }

  saveChiTietSanXuat(): void {
    //kiểm tra sự thay đổi
    if (this.isSignalChange === false) {
      this.onChangeChiTietSXHN();
      this.isSignalChange = true;
    }
    if (this.editForm.get(['id'])!.value === undefined) {
      // gán id kịch bản, mã kịch bản vào list chi tiết kịch bản request
      for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
        this.listOfChiTietKichBan[i].idSanXuatHangNgay = this.idSanXuatHangNgay;
      }
      console.log('gan: ', this.listOfChiTietKichBan);
      //------------ cập nhật kich_ban_id trong table chi tiết sản xuất -------------
      if (this.listOfChiTietKichBan[0].idSanXuatHangNgay === undefined) {
        // alert('Kịch bản chưa được khởi tạo');
      } else {
        this.previousState();
      }
      console.log(this.listOfChiTietKichBan);
    } else {
      //------------ cập nhật kich_ban_id trong table chi tiết sản xuất -------------
      this.previousState();
      // console.log(this.listOfChiTietKichBan);
    }
  }

  subscribeToCreateResponse(result: Observable<HttpResponse<ISanXuatHangNgay>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(res => {
      this.idSanXuatHangNgay = res.body?.id;
      this.ocChangeKichBanSXHN();
    });
  }
  subscribeToSaveResponse(result: Observable<HttpResponse<ISanXuatHangNgay>>): void {
    // alert('Cập nhật thành công');
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe(res => {
      this.idSanXuatHangNgay = res.body?.id;
      this.ocChangeKichBanSXHN();
    });
  }
  // bat su kien thay doi
  ocChangeKichBanSXHN(): void {
    const result = sessionStorage.getItem('ma thiet bi goc');
    if (result) {
      if (this.onSelectItemRequest.toString() !== result.toString()) {
        console.log('bắt được sự kiện thay đổi');
        console.log('ma thiet bi goc: ', result.toString());
        console.log('ma thiet bi thay doi: ', this.onSelectItemRequest.toString());
        const change = { signal: 2 };
        this.http.put<any>(`${this.changeSignalUrl}/${this.idSanXuatHangNgay as number}`, change).subscribe(() => {
          console.log('thanh cong');
          this.isSignalChange = true;
        });
      } else {
        console.log('khong bat duoc su kien thay doi');
      }
    }
  }
  onChangeChiTietSXHN(): void {
    const result = sessionStorage.getItem('kich ban goc');
    if (result) {
      this.originListOfChiTietKichBan = JSON.parse(result);
      console.log('kich ban thay doi', this.listOfChiTietKichBan);
      console.log('kich ban goc', this.originListOfChiTietKichBan);
      for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
        if (
          this.listOfChiTietKichBan[i].thongSo !== this.originListOfChiTietKichBan[i].thongSo ||
          this.listOfChiTietKichBan[i].minValue !== this.originListOfChiTietKichBan[i].minValue ||
          this.listOfChiTietKichBan[i].maxValue !== this.originListOfChiTietKichBan[i].maxValue ||
          this.listOfChiTietKichBan[i].trungbinh !== this.originListOfChiTietKichBan[i].trungbinh ||
          this.listOfChiTietKichBan[i].donVi !== this.originListOfChiTietKichBan[i].donVi
        ) {
          console.log('bắt được sự kiện thay đổi');
          // thay đổi signal khi có sự thay đổi
          const change = { signal: 2 };
          this.http.put<any>(`${this.changeSignalUrl}/${this.idSanXuatHangNgay as number}`, change).subscribe(() => {
            console.log('thanh cong');
          });
          break;
        } else {
          console.log('khong co su thay doi');
        }
      }
    }
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
    if (this.editForm.get(['id'])!.value !== undefined) {
      this.result = 'Cập nhật kịch bản thành công';
      // this.showSuccessPopupService = true;
    } else {
      this.result = 'Thêm mới kịch bản thành công';
      // this.showSuccessPopupService = true;
    }
    this.showSuccessPopupService = true;
  }

  closeSuccessPopupService(): void {
    this.showSuccessPopupService = false;
  }

  openSuccessPopup(): void {
    if (this.editForm.get(['id'])!.value === undefined) {
      // gán id kịch bản, mã kịch bản vào list chi tiết kịch bản request
      for (let i = 0; i < this.listOfChiTietKichBan.length; i++) {
        this.listOfChiTietKichBan[i].idSanXuatHangNgay = this.idSanXuatHangNgay;
      }
      // console.log("gan: ", this.listOfChiTietKichBan);
      //------------ cập nhật kich_ban_id trong table chi tiết sản xuất -------------
      if (this.listOfChiTietKichBan[0].idSanXuatHangNgay === undefined) {
        this.resultThongSo = 'Kịch bản chưa được khởi tạo';
      } else {
        this.http.post<any>(this.chiTietSanXuatUrl, this.listOfChiTietKichBan).subscribe(() => {
          this.resultThongSo = 'Thêm mới chi tiết sản xuất thành công';
          // this.previousState();
        });
      }
      // console.log(this.listOfChiTietKichBan);
    } else {
      //------------ cập nhật kich_ban_id trong table chi tiết sản xuất -------------
      this.http.put<any>(this.putChiTietSanXuatUrl, this.listOfChiTietKichBan).subscribe(() => {
        this.resultThongSo = 'Cập nhật chi tiết sản xuất thành công';
        // this.previousState();
        // console.log(this.listOfChiTietKichBan);
      });
    }
    this.showSuccessPopup = true;
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  updateForm(sanXuatHangNgay: ISanXuatHangNgay): void {
    this.editForm.patchValue({
      id: sanXuatHangNgay.id,
      maKichBan: sanXuatHangNgay.maKichBan,
      maThietBi: sanXuatHangNgay.maThietBi,
      loaiThietBi: sanXuatHangNgay.loaiThietBi,
      dayChuyen: sanXuatHangNgay.dayChuyen,
      maSanPham: sanXuatHangNgay.maSanPham,
      versionSanPham: sanXuatHangNgay.versionSanPham,
      ngayTao: sanXuatHangNgay.ngayTao ? sanXuatHangNgay.ngayTao.format(DATE_TIME_FORMAT) : null,
      timeUpdate: sanXuatHangNgay.timeUpdate ? sanXuatHangNgay.timeUpdate.format(DATE_TIME_FORMAT) : null,
      trangThai: sanXuatHangNgay.trangThai,
      signal: sanXuatHangNgay.signal,
    });
  }

  createFromForm(): ISanXuatHangNgay {
    return {
      ...new SanXuatHangNgay(),
      id: this.editForm.get(['id'])!.value,
      maKichBan: this.editForm.get(['maKichBan'])!.value,
      maThietBi: this.onSelectItemRequest.toString(),
      loaiThietBi: this.editForm.get(['loaiThietBi'])!.value,
      dayChuyen: this.dayChuyen,
      maSanPham: this.maSanPham,
      versionSanPham: this.versionSanPham,
      ngayTao: this.editForm.get(['ngayTao'])!.value ? dayjs(this.editForm.get(['ngayTao'])!.value, DATE_TIME_FORMAT) : undefined,
      timeUpdate: this.editForm.get(['timeUpdate'])!.value ? dayjs(this.editForm.get(['timeUpdate'])!.value, DATE_TIME_FORMAT) : undefined,
      trangThai: this.editForm.get(['trangThai'])!.value,
      signal: 1,
    };
  }
  //----------------------------------------- them moi chi tiet san xuat --------------------------

  addRowThongSoKichBan(): void {
    const newRow = {
      id: 0,
      idSanXuatHangNgay: this.idSanXuatHangNgay,
      maKichBan: this.editForm.get(['maKichBan'])!.value,
      thongSo: '',
      minValue: 0,
      maxValue: 0,
      trungbinh: 0,
      donVi: '',
    };
    this.listOfChiTietKichBan.push(newRow);
    const newRow1 = {
      id: 0,
      idSanXuatHangNgay: this.idSanXuatHangNgay,
      maKichBan: this.editForm.get(['maKichBan'])!.value,
      thongSo: '',
      minValue: 0,
      maxValue: 0,
      trungbinh: 0,
      donVi: '',
    };
    this.originListOfChiTietKichBan.push(newRow1);
    console.log('add row', this.listOfChiTietKichBan);
  }

  // sua lai xoa theo stt va ma thong so (id )
  deleteRow(thongSo: string | null | undefined, id: number | null | undefined): void {
    const sanXuatHangNgay = this.createFromForm();
    if (sanXuatHangNgay.id !== undefined) {
      if (confirm('Bạn chắc chắn muốn xóa thông số này?') === true) {
        this.http.delete(`${this.delUrl}/${id as number}`).subscribe(() => {
          alert('Xóa thông số thành công!');
        });
        this.listOfChiTietKichBan = this.listOfChiTietKichBan.filter(d => d.thongSo !== thongSo);
      }
    } else {
      this.listOfChiTietKichBan = this.listOfChiTietKichBan.filter(d => d.thongSo !== thongSo);
    }
  }
}
