class ItemsController < ApplicationController
  def index
    @items = Item.order(created_at: :desc)
    render json: @items
  end

  def create
    @item = Item.find_or_initialize_by(name: item_params[:name])
    if @item.save
      render json: @item, status: :created
    else
      render json: @item.errors, status: :unprocessable_entity
    end
  end

  private

  def item_params
    params.require(:item).permit(:name)
  end
end
