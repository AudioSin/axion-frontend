import {
  Component,
  EventEmitter,
  NgZone,
  OnDestroy,
  ViewChild,
  TemplateRef,
} from "@angular/core";
import { CookieService } from "ngx-cookie-service";
import { ContractService } from "../services/contract";

@Component({
  selector: "app-auction-page",
  templateUrl: "./auction-page.component.html",
  styleUrls: ["./auction-page.component.scss"],
})
export class AuctionPageComponent implements OnDestroy {
  @ViewChild("successModal", {
    static: true,
  })
  successModal: TemplateRef<any>;

  public account;
  public tokensDecimals;
  private accountSubscribe;
  public onChangeAccount: EventEmitter<any> = new EventEmitter();

  public formsData: {
    auctionAmount?: string;
  } = {};

  public referalLink = "";
  public addressCopy = false;

  public sendAuctionProgress: boolean;
  public auctionInfo: any;
  public auctionsList: any[];

  public currentSort: any = {};

  constructor(
    private contractService: ContractService,
    private cookieService: CookieService,
    private ngZone: NgZone
  ) {
    this.accountSubscribe = this.contractService
      .accountSubscribe()
      .subscribe((account: any) => {
        if (!account || account.balances) {
          this.ngZone.run(() => {
            this.account = account;
            window.dispatchEvent(new Event("resize"));
            if (account) {
              this.onChangeAccount.emit();
              this.contractService.getAuctionInfo().then((result) => {
                this.auctionInfo = result;
                window.dispatchEvent(new Event("resize"));
              });
              this.contractService.getUserAuctions().then((auctions) => {
                this.auctionsList = auctions;
                window.dispatchEvent(new Event("resize"));
              });
            }
          });
        }
      });
    this.tokensDecimals = this.contractService.getCoinsDecimals();
  }

  public sendETHToAuction() {
    this.sendAuctionProgress = true;
    this.contractService
      .sendETHToAuction(
        this.formsData.auctionAmount,
        this.cookieService.get("ref")
      )
      .then(({ transactionHash }) => {
        this.contractService.updateETHBalance(true).then(() => {
          this.sendAuctionProgress = false;
          this.formsData.auctionAmount = undefined;
        });
      })
      .catch(() => {
        this.sendAuctionProgress = false;
      });
  }

  public generateRefLink() {
    this.referalLink =
      window.location.origin + "/auction?ref=" + this.account.address;
  }

  public onCopied() {
    this.addressCopy = true;

    setTimeout(() => {
      this.addressCopy = false;
    }, 2500);
  }

  public auctionWithdraw(auction) {
    auction.withdrawProgress = true;
    this.contractService
      .withdrawFromAuction(auction.auctionId)
      .then(() => {
        this.contractService.loadAccountInfo();
        auction.withdrawProgress = false;
      })
      .catch(() => {
        auction.withdrawProgress = false;
      });
  }

  private applySort() {
    if (this.currentSort.field) {
      this.auctionsList.sort((a, b) => {
        let aValue = a[this.currentSort.field];
        let bValue = b[this.currentSort.field];
        switch (this.currentSort.field) {
          case "start":
            aValue = aValue.getTime();
            bValue = bValue.getTime();
            break;
          case "token":
          case "eth":
          case "accountTokenBalance":
            aValue = aValue.toNumber();
            bValue = bValue.toNumber();
            break;
        }

        return aValue > bValue
          ? this.currentSort.ask
            ? 1
            : -1
          : aValue < bValue
          ? this.currentSort.ask
            ? -1
            : 1
          : 1;
      });
    } else {
      this.auctionsList.sort((a, b) => {
        return Number(a.auctionId) > Number(b.auctionId) ? 1 : -1;
      });
    }
  }

  public sortAuctions(field) {
    const currentUseField = this.currentSort.field;

    if (currentUseField !== field) {
      this.currentSort.field = field;
      this.currentSort.ask = false;
    } else {
      if (!this.currentSort.ask) {
        this.currentSort.ask = true;
      } else {
        this.currentSort.field = undefined;
      }
    }
    this.applySort();
  }

  ngOnDestroy() {
    this.accountSubscribe.unsubscribe();
  }
}
