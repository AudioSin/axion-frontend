import {
  Component,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ContractService } from "../services/contract";

@Component({
  selector: "app-claim-page",
  templateUrl: "./claim-page.component.html",
  styleUrls: ["./claim-page.component.scss"],
})
export class ClaimPageComponent implements OnDestroy {
  public account;
  public tokensDecimals;
  private accountSubscribe;
  public formsData: {
    swapAmount?: string;
  } = {};
  public swapContractBalance;
  public onChangeAccount: EventEmitter<any> = new EventEmitter();
  public swapTokensProgress: boolean;
  public updateSwapBalanceProgress: boolean;
  public withdrawH2TProgress: boolean;
  public burnTokensProgress: boolean;
  public claimTokensProgress: boolean;

  public clacPenalty = 0;

  public swapNativeTokenInfo: any;

  @ViewChild("sendForm", { static: false }) sendForm;

  constructor(
    private contractService: ContractService,
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
              this.updateSwapBalanceProgress = true;
              this.readSwapNativeToken();
              this.contractService.swapTokenBalanceOf().then((balance) => {
                this.swapContractBalance = balance;
                this.updateSwapBalanceProgress = false;
                window.dispatchEvent(new Event("resize"));
              });
            }
          });
        }
      });
    this.tokensDecimals = this.contractService.getCoinsDecimals();
  }

  private readSwapNativeToken() {
    this.contractService.readSwapNativeToken().then((result) => {
      this.swapNativeTokenInfo = result;
      console.log("this.swapNativeTokenInfo", this.swapNativeTokenInfo);
      window.dispatchEvent(new Event("resize"));
    });
  }

  public swapH2T() {
    this.swapTokensProgress = true;
    this.contractService
      .swapH2T(this.formsData.swapAmount)
      .then(() => {
        this.contractService.updateH2TBalance(true).then(() => {
          this.formsData.swapAmount = "";
          this.swapTokensProgress = false;
        });
      })
      .catch(() => {
        this.swapTokensProgress = false;
      });
  }

  public withdrawH2T() {
    this.withdrawH2TProgress = true;
    this.contractService
      .withdrawH2T()
      .then(() => {
        this.contractService.updateH2TBalance(true).then(() => {
          this.withdrawH2TProgress = false;
        });
      })
      .catch(() => {
        this.withdrawH2TProgress = false;
      });
  }

  public onChangeAmount() {
    console.log(this.formsData.swapAmount);

    this.contractService
      .calculatePenalty(Number(this.formsData.swapAmount))
      .then((res) => {
        this.clacPenalty = res as number;
      });
  }

  public burnH2T() {
    this.burnTokensProgress = true;
    this.contractService
      .swapNativeToken()
      .then(() => {
        this.burnTokensProgress = false;
        // this.contractService.updateH2TBalance(true).then(() => {
        //   this.burnTokensProgress = false;
        // });
      })
      .catch(() => {
        this.burnTokensProgress = false;
      });
  }

  public claim() {
    this.claimTokensProgress = true;
    this.contractService
      .claimFromForeign()
      .then(() => {
        this.claimTokensProgress = false;
        // this.contractService.updateH2TBalance(true).then(() => {
        //   this.burnTokensProgress = false;
        // });
      })
      .catch(() => {
        this.claimTokensProgress = false;
      });
  }

  ngOnDestroy() {
    this.accountSubscribe.unsubscribe();
  }
}
