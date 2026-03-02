<!--
/**
 * 保證書列印元件
 *
 * @module order-management/components/WarrantyPrint
 * @description 供內部使用的保證書列印,包含完整資訊:
 *              訂單編號、客戶資訊、商品詳情、金額明細、付款狀態、
 *              訂單狀態、出貨狀態、操作者等
 */
-->
<script setup lang="ts">
import type { SalesOrder } from "@/pages/order-management/types"
import qrcodeImg from "@@/assets/images/qrcode.png"
import { Printer } from "@element-plus/icons-vue"
import {
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElTag
} from "element-plus"
import {
  ACCESSORY_OPTIONS,
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_COLORS,
  SHIPPING_STATUS_LABELS
} from "@/pages/order-management/types"
import BrandBanner from "./BrandBanner.vue"
import "@/common/assets/fonts/fonts.css"

defineOptions({ name: "WarrantyPrint" })

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

interface Props {
  /** 對話框是否顯示 */
  visible: boolean
  /** 訂單詳情資料 */
  order: SalesOrder | null
}

interface Emits {
  (e: "update:visible", value: boolean): void
}

/**
 * 將配件值轉換為中文標籤
 */
function formatAccessories(accessories: string[]): string {
  if (!accessories || accessories.length === 0) return ""
  return accessories
    .map((accessory) => {
      const option = ACCESSORY_OPTIONS.find(opt => opt.value === accessory)
      return option ? option.label : accessory
    })
    .join("、")
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
}

/**
 * 處理列印
 */
function handlePrint() {
  window.print()
}

/**
 * 處理關閉
 */
function handleClose() {
  emit("update:visible", false)
}
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    title="保證書列印"
    width="900px"
    class="warranty-print-dialog"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="props.order" class="warranty-print">
      <div class="print-header">
        <div class="order-number-badge">
          {{ props.order.orderNumber }}
        </div>
        <BrandBanner />
      </div>

      <!-- 門市資訊 -->
      <div class="store-info-section">
        <div class="store-info-text">
          <div class="store-info-item">
            <span class="store-info-label">門市地址：</span>
            <span>新北市新莊區立信三街7號3樓</span>
          </div>
          <div class="store-info-item">
            <span class="store-info-label">聯絡電話：</span>
            <span>0971-877-030</span>
          </div>
          <div class="store-info-item">
            <span class="store-info-label">官方LINE：</span>
            <span>@realyou</span>
          </div>
        </div>
        <img :src="qrcodeImg" alt="QR Code" class="store-info-qrcode">
      </div>

      <!-- 訂單基本資訊 -->
      <div class="section">
        <h3 class="section-title">
          訂單資訊
        </h3>
        <ElDescriptions
          :column="3"
          border
          size="small"
        >
          <ElDescriptionsItem label="訂單日期">
            {{ formatDate(props.order.orderDate) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="訂單類型">
            {{ ORDER_TYPE_LABELS[props.order.orderType] }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="收件方式">
            {{ DELIVERY_METHOD_LABELS[props.order.deliveryMethod] }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="客戶名稱">
            {{ props.order.customerName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="客戶電話">
            {{ props.order.customerPhone }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 狀態資訊 -->
      <div class="section">
        <h3 class="section-title">
          狀態資訊
        </h3>
        <ElDescriptions
          :column="3"
          border
          size="small"
        >
          <ElDescriptionsItem label="訂單狀態">
            <ElTag
              :type="ORDER_STATUS_COLORS[props.order.orderStatus]"
              size="small"
            >
              {{ ORDER_STATUS_LABELS[props.order.orderStatus] }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="付款狀態">
            <ElTag
              :type="PAYMENT_STATUS_COLORS[props.order.paymentStatus]"
              size="small"
            >
              {{ PAYMENT_STATUS_LABELS[props.order.paymentStatus] }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="出貨狀態">
            <ElTag
              :type="SHIPPING_STATUS_COLORS[props.order.shippingStatus]"
              size="small"
            >
              {{ SHIPPING_STATUS_LABELS[props.order.shippingStatus] }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>

      <!-- 商品明細 -->
      <div class="section">
        <h3 class="section-title">
          商品明細
        </h3>
        <div class="product-cards">
          <div
            v-for="(item, index) in props.order.orderItems"
            :key="item.id"
            class="product-card"
          >
            <div class="product-card-header">
              <span class="product-index">#{{ index + 1 }}</span>
              <span class="product-name">{{ item.productName }}</span>
            </div>
            <div class="product-card-body">
              <div class="product-field">
                <span class="field-label">品牌</span>
                <span class="field-value">{{ item.brandName }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">磐石編碼</span>
                <span class="field-value">{{ item.panshiCode }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">Serial ID</span>
                <span class="field-value">{{ item.serialId }}</span>
              </div>
              <div class="product-field">
                <span class="field-label">款式</span>
                <span class="field-value">{{ item.productStyle }}</span>
              </div>
              <div
                v-if="item.accessories && item.accessories.length > 0"
                class="product-field product-field-full"
              >
                <span class="field-label">配件</span>
                <span class="field-value">{{
                  formatAccessories(item.accessories)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他資訊 -->
      <div class="section">
        <h3 class="section-title">
          其他資訊
        </h3>
        <ElDescriptions
          :column="2"
          border
          size="small"
        >
          <ElDescriptionsItem label="承辦人員">
            {{ props.order.createdByName }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="承辦日期">
            {{ formatDate(props.order.createdAt) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem v-if="props.order.remarks" label="備註" :span="2">
            {{ props.order.remarks }}
          </ElDescriptionsItem>
        </ElDescriptions>
      </div>
      <!-- 保證書標題 -->
      <div class="warranty-title-section">
        <h2 class="warranty-title">
          保 證 書
        </h2>
      </div>
      <!-- 銷貨說明 -->
      <div class="section sales-notice-section">
        <h3 class="section-title">
          銷貨說明
        </h3>
        <ol class="sales-notice-list">
          <li>本公司售出之商品皆由專業人員鑑定完成，保證正品，特立此證為憑。</li>
          <li>本公司設有專業鑑定團隊，各縣市皆可上門收購。</li>
          <li>
            收到商品後，半年內依合況，最高收購價格為買入價格7折，代購商品除外。
            <br>
            （商品收購價格會因品牌、市場流通而有差異）
          </li>
          <li>商品售出不接受退換貨，經雙方前對談價評估。</li>
          <li>因這貨品非品牌對接，故商品保固及維修問題，請洽品牌專櫃或由進貨代換。</li>
          <li>收到商品7天內有任何問題請聯繫官方 LINE@realyou</li>
        </ol>
      </div>
    </div>

    <template #footer>
      <ElButton @click="handleClose">
        關閉
      </ElButton>
      <ElButton type="primary" :icon="Printer" @click="handlePrint">
        列印
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.warranty-print {
  padding: 0 16px;
}

.print-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.order-number-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-color-danger);
  letter-spacing: 0.5px;
}

.store-info-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background-color: var(--el-fill-color-lighter);
  font-size: 13px;
  line-height: 1.6;
}

.store-info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.store-info-item {
  display: flex;
  align-items: center;
}

.store-info-label {
  color: var(--el-text-color-secondary);
  min-width: 70px;
  flex-shrink: 0;
}

.store-info-qrcode {
  width: 80px;
  height: 80px;
  object-fit: contain;
  flex-shrink: 0;
}

.label-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 4px;
  margin: 0;
  color: var(--el-text-color-primary);
}

.print-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--el-border-color);
}

.total-amount {
  font-weight: 700;
  color: var(--el-color-danger);
  font-size: 16px;
}

/* 商品卡片 */
.product-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  overflow: hidden;
}

.product-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  font-size: 14px;
}

.product-index {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  min-width: 20px;
}

.product-name {
  color: var(--el-text-color-primary);
}

.product-card-body {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.product-field {
  display: flex;
  flex-direction: column;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  border-right: 1px solid var(--el-border-color-extra-light);

  &:nth-child(4n) {
    border-right: none;
  }

  &:nth-last-child(-n + 4) {
    border-bottom: none;
  }
}

.product-field-full {
  grid-column: 1 / -1;
  border-right: none !important;
  border-top: 1px solid var(--el-border-color-extra-light);
  border-bottom: none;
}

.field-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 2px;
}

.field-value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;

  &.price {
    font-weight: 600;
    color: var(--el-color-danger);
  }
}

/* 銷貨說明 */
.sales-notice-section {
  margin-top: 24px;
}

.sales-notice-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 2;
  color: var(--el-text-color-primary);

  li {
    padding-left: 4px;
  }
}

/* 保證書標題 */
.warranty-title-section {
  text-align: center;
  margin-top: 26px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color);
}

.warranty-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 12px;
  margin: 0;
  color: var(--el-text-color-primary);
}

/* 平板響應式 */
@media (max-width: 860px) {
  .warranty-print {
    padding: 0 8px;
  }

  .product-card-body {
    grid-template-columns: repeat(2, 1fr);
  }

  .product-field {
    &:nth-child(4n) {
      border-right: 1px solid var(--el-border-color-extra-light);
    }

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-last-child(-n + 4) {
      border-bottom: 1px solid var(--el-border-color-extra-light);
    }

    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }
  }
}
</style>

<!-- 非 scoped 樣式：用於對話框本體及列印 -->
<style lang="scss">
/* 對話框響應式寬度（平板適配） */
.warranty-print-dialog {
  max-width: 95vw;
}

/* A4 列印樣式 */
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  /* 隱藏頁面所有內容（#app 及其他非 overlay 元素） */
  body > *:not(.el-overlay) {
    display: none !important;
  }

  /* 隱藏所有 overlay */
  body > .el-overlay {
    display: none !important;
  }

  /**
   * 顯示保證書 overlay（僅當對話框為開啟狀態）
   * :not([style*="display: none"]) 確保只匹配實際可見的 overlay，
   * 避免關閉但仍殘留在 DOM 中的 overlay 干擾其他列印對話框
   */
  body > .el-overlay:not([style*="display: none"]):has(.warranty-print-dialog) {
    display: block !important;
    position: static !important;
    background: none !important;
    overflow: visible !important;
  }

  body > .el-overlay:not([style*="display: none"]):has(.warranty-print-dialog) .el-overlay-dialog {
    position: static !important;
    overflow: visible !important;
  }

  .warranty-print-dialog {
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    transform: none !important;

    .el-dialog__header {
      display: none !important;
    }

    .el-dialog__footer {
      display: none !important;
    }

    .el-dialog__body {
      padding: 0 !important;
      overflow: visible !important;
    }
  }

  .warranty-print {
    padding: 0 !important;
    width: 100% !important;
    /* 整體縮放至 80%，確保所有內容收納於單頁 A4 */
    zoom: 0.8;
  }

  /* 壓縮 header 間距 */
  .print-header {
    margin-bottom: 10px !important;
  }

  /* 壓縮門市資訊 */
  .store-info-section {
    padding: 6px 10px !important;
    margin-bottom: 10px !important;
    font-size: 11px !important;
    gap: 8px !important;
    line-height: 1.5 !important;
  }

  .store-info-qrcode {
    width: 58px !important;
    height: 58px !important;
  }

  /* 壓縮各區塊間距 */
  .section {
    margin-bottom: 8px !important;
  }

  .section-title {
    font-size: 12px !important;
    margin-bottom: 4px !important;
    padding-bottom: 2px !important;
  }

  /* 壓縮 ElDescriptions 單元格 padding */
  .el-descriptions__cell {
    padding: 4px 8px !important;
    font-size: 11px !important;
  }

  /* 列印時卡片樣式 */
  .product-cards {
    gap: 6px !important;
  }

  .product-card {
    break-inside: avoid;
    border-color: #ddd !important;
  }

  .product-card-header {
    padding: 4px 8px !important;
    font-size: 12px !important;
    background-color: #f5f5f5 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .product-card-body {
    grid-template-columns: repeat(4, 1fr) !important;
  }

  .product-field {
    padding: 4px 8px !important;
  }

  .field-label {
    font-size: 10px !important;
    margin-bottom: 1px !important;
  }

  .field-value {
    font-size: 11px !important;
  }

  /* 壓縮保證書標題區 */
  .warranty-title-section {
    margin-top: 10px !important;
    padding-top: 8px !important;
  }

  .warranty-title {
    font-size: 15px !important;
    letter-spacing: 10px !important;
  }

  /* 壓縮銷貨說明 */
  .sales-notice-section {
    margin-top: 6px !important;
  }

  .sales-notice-list {
    font-size: 11px !important;
    line-height: 1.6 !important;
    padding-left: 16px !important;
  }
}
</style>
