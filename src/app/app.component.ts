import { Component, NgZone, ViewChild, OnInit } from "@angular/core";
import { TransactionSuccessModalComponent } from "./components/transactionSuccessModal/transaction-success-modal.component";
import { MetamaskErrorComponent } from "./components/metamaskError/metamask-error.component";
import { ContractService } from "./services/contract";
import { MatDialog } from "@angular/material/dialog";
import { ActivationStart, NavigationStart, Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  public isNavbarOpen;
  public isHeaderActive;
  public account;
  private accountSubscribe;
  public leftDaysInfo;
  public tableInfo;
  public runLineCountArray = new Array(1);
  @ViewChild("runString", { static: false }) runString;
  constructor(
    private contractService: ContractService,
    private ngZone: NgZone,
    public dialog: MatDialog,
    route: Router
  ) {
    this.accountSubscribe = this.contractService
      .accountSubscribe()
      .subscribe((account) => {
        if (account) {
          this.accountSubscribe.unsubscribe();
          this.subscribeAccount();
        }
      });

    this.contractService
      .transactionsSubscribe()
      .subscribe((transaction: any) => {
        if (transaction) {
          this.dialog.open(TransactionSuccessModalComponent, {
            width: "400px",
            data: transaction.hash,
          });
        }
      });
    this.contractService.getAccount(true);

    this.contractService.getEndDateTime().then((result) => {
      this.leftDaysInfo = result;
    });
    this.isNavbarOpen = false;

    this.contractService.getContractsInfo().then((info) => {
      this.tableInfo = info;
      this.iniRunString();
    });

    this.isHeaderActive = false;

    route.events.subscribe((event) => {
      if (event instanceof ActivationStart) {
        if (event.snapshot.queryParams.ref) {
          document.cookie = `ref=${event.snapshot.queryParams.ref}; ${
            new Date().getTime() + 5 * 24 * 60 * 60 * 1000
          };''`;
        }
      }

      if (event instanceof NavigationStart) {
        window.scrollTo(0, 0);
      }
    });
  }

  public openNavbar() {
    this.isNavbarOpen = !this.isNavbarOpen;
  }

  public subscribeAccount() {
    if (this.account) {
      return;
    }
    this.accountSubscribe = this.contractService
      .accountSubscribe()
      .subscribe((account: any) => {
        this.ngZone.run(() => {
          if (
            account &&
            (!this.account || this.account.address !== account.address)
          ) {
            this.contractService.loadAccountInfo();
          }
          this.account = account;
        });
      });
    this.contractService.getAccount().catch((err) => {
      this.dialog.open(MetamaskErrorComponent, {
        width: "400px",
        data: err,
      });
    });
  }

  iniRunString() {
    const runStringElement = this.runString.nativeElement;
    const runStringItem = runStringElement.getElementsByClassName(
      "repeat-content"
    )[0];
    this.runLineCountArray.length =
      Math.ceil(runStringElement.offsetWidth / runStringItem.offsetWidth) * 2;

    setInterval(() => {
      const allElements = runStringElement.getElementsByClassName(
        "repeat-content"
      );
      const marginLeft = allElements[0].style.marginLeft || "0px";
      const newMarginLeft = marginLeft.replace("px", "") - 1;
      allElements[0].style.marginLeft = newMarginLeft + "px";
      if (-newMarginLeft > allElements[0].offsetWidth) {
        allElements[0].style.marginLeft = 0;
        runStringElement.appendChild(allElements[0]);
      }
    }, 30);
  }

  private onScrollWindow() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    this.isHeaderActive = scrollTop >= 10;
  }

  ngOnInit(): void {
    window.addEventListener("scroll", this.onScrollWindow.bind(this));
  }
}
