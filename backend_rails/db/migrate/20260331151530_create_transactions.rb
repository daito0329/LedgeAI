class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.string :title
      t.integer :amount
      t.string :transaction_type
      t.date :date

      t.timestamps
    end
  end
end
