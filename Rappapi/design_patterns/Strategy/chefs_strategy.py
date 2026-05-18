from abc import ABC, abstractmethod

class StatisStrategy(ABC):
    @abstractmethod
    def chef_statis(self, request):
        pass

class StatisMon(StatisStrategy):
    def chef_statis(self, request):
