from Rappapi.models import TableStatus

class TableState:
    def customer_checkin(self, table):
        pass
    def customer_order(self, table, total_price=0):
        pass
    def customer_checkout(self, table):
        pass

class AvailableTableState(TableState):
    def customer_checkin(self, table):
        table.status = TableStatus.BOOKED
        table.save()
        table._notify_firebase('BOOKED', 0)


class CheckInTableState(TableState):
    def customer_order(self, table, total_price=0):
        table.status = TableStatus.OCCUPIED
        table.save()
        table._notify_firebase('OCCUPIED', total_price)


class OccupiedTableState(TableState):
    def customer_order(self, table, total_price=0):
        table._notify_firebase('OCCUPIED', total_price)

    def customer_checkout(self, table):
        table.status = TableStatus.AVAILABLE
        table.save()
        table._notify_firebase('AVAILABLE', 0)