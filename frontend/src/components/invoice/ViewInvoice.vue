<template>
  <div class="view-inovices-container">
    <b-container class="bv-example-row">
      <b-row>
        <b-col>
          <h2 class="invoices">All Invoices:</h2>
          <hr>
          <div>
            <b-table bordered hover :items="invoices" :fields="fields">
              <template v-slot:cell(view)="data">
                <b-button
                pill
                variant="outline-success"
                size="sm"
                :to="{ name: 'singleInvoice', params: { id: data.item.id } }"
                >
                  Details
                </b-button>
              </template>
            </b-table>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import invoiceService from '@/services/invoiceService'

export default {
  name: 'viewInvoice',
  data () {
    return {
      invoices: [],
      fields: [
        { key: 'id', label: 'Invoice #' },
        { key: 'name' },
        {
          key: 'status',
          formatter: (value, key, item) => {
            if (item.amount_paid === 0) {
              return "Unpaid"
            } else if (item.amount_paid === item.total_due) {
              return "Paid"
            } else {
              return "Partial Payment"
            }
          }
        },
        { key: 'view' }
      ]
    }
  },
  computed: {
    user() {
      return this.$store.getters.getUser
    }
  },
  async created () {
    try {
      await invoiceService.index().then(res => {
        this.invoices = res.data.invoices
      })
    } catch (err) {
      alert(err.response.data.error)
    }
  }
}
</script>

<style scoped>

.view-inovices-container {
  padding-top: 65px;
}

</style>
