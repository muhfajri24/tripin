"""Canonical wire contracts. Structural consistency only; no planning/search engine."""

from datetime import date, datetime, timedelta
from typing import Annotated, Literal
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    BeforeValidator,
    field_validator,
    model_validator,
)

Id = Annotated[
    str, Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$")
]
Text = Annotated[str, Field(min_length=1, max_length=1000)]
Money = Annotated[int, Field(strict=True, ge=0)]
Positive = Annotated[int, Field(strict=True, gt=0)]
Clock = Annotated[str, Field(pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")]
LocalDate = Annotated[str, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")]


def local_date(value):
    date.fromisoformat(value)
    return value


def jakarta(value):
    if value.utcoffset() != timedelta(hours=7):
        raise ValueError("timestamp must have Asia/Jakarta offset +07:00")
    return value


def iso_timestamp(value):
    if not isinstance(value, (str, datetime)):
        raise ValueError("timestamp must be ISO 8601, not an epoch number")
    return value


Timestamp = Annotated[datetime, BeforeValidator(iso_timestamp)]


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    @model_validator(mode="before")
    @classmethod
    def strict_schema_version(cls, value):
        if (
            isinstance(value, dict)
            and "schemaVersion" in value
            and type(value["schemaVersion"]) is not int
        ):
            raise ValueError("schemaVersion must be an integer")
        return value


class Coordinates(Contract):
    lat: Annotated[float, Field(ge=-90, le=90, strict=True)]
    lng: Annotated[float, Field(ge=-180, le=180, strict=True)]


class Evidence(Contract):
    sourceType: Literal["curated", "provider", "user"]
    sourceRef: Text | None
    checkedAt: Timestamp | None
    status: Literal["checked", "estimated", "unverified"]

    @model_validator(mode="after")
    def evidence_is_traceable(self):
        if self.checkedAt is not None and self.checkedAt.utcoffset() is None:
            raise ValueError("checkedAt must include timezone")
        if self.status == "checked" and (not self.sourceRef or self.checkedAt is None):
            raise ValueError("checked evidence needs sourceRef and checkedAt")
        return self


class Price(Contract):
    amountIdr: Money | None
    basis: Literal["person", "group", "room_night", "vehicle_day", "vehicle_km"]
    evidence: Evidence

    @model_validator(mode="after")
    def unknown_price(self):
        if self.amountIdr is None and self.evidence.status != "unverified":
            raise ValueError("unknown price must remain unverified")
        return self


class OpeningWindow(Contract):
    weekday: Annotated[int, Field(strict=True, ge=0, le=6)]  # Monday=0
    opens: Clock
    closes: Clock

    @model_validator(mode="after")
    def ordered(self):
        if self.opens >= self.closes:
            raise ValueError(
                "opening window must end after start; split overnight windows"
            )
        return self


class DateException(Contract):
    date: LocalDate
    closed: StrictBool
    _date = field_validator("date")(local_date)


class Place(Contract):
    id: Id
    name: Text
    destinationId: Id
    coordinates: Coordinates | None
    address: Text | None
    categories: Annotated[list[Id], Field(min_length=1)]
    kind: Literal["attraction", "food", "local_business", "lodging"]
    visitDurationMin: Positive
    durationEvidence: Evidence
    openingWindows: list[OpeningWindow] | None
    dateExceptions: list[DateException]
    prices: Annotated[list[Price], Field(min_length=1)]
    openingEvidence: Evidence
    locationEvidence: Evidence
    identityEvidence: Evidence
    isLocalBusiness: StrictBool | None
    localBusinessEvidence: Evidence
    googlePlaceId: Text | None

    @model_validator(mode="after")
    def unknown_metadata(self):
        for value, evidence in [
            (self.coordinates, self.locationEvidence),
            (self.openingWindows, self.openingEvidence),
            (self.isLocalBusiness, self.localBusinessEvidence),
        ]:
            if value is None and evidence.status != "unverified":
                raise ValueError("missing metadata must remain unverified")
        return self


class Budget(Contract):
    totalIdr: Positive
    originalBasis: Literal["person", "group"]
    reserveIdr: Money

    @model_validator(mode="after")
    def reserve(self):
        if self.reserveIdr > self.totalIdr:
            raise ValueError("reserve exceeds total budget")
        return self


class Travelers(Contract):
    adults: Annotated[int, Field(strict=True, ge=1, le=6)]


class DayWindow(Contract):
    date: LocalDate
    start: Clock
    end: Clock
    _date = field_validator("date")(local_date)

    @model_validator(mode="after")
    def ordered(self):
        if self.start >= self.end:
            raise ValueError("daily window must end after start")
        return self


class Lodging(Contract):
    placeId: Id
    rooms: Positive
    nights: Annotated[int, Field(strict=True, ge=1, le=2)]
    checkInAt: Timestamp | None

    @field_validator("checkInAt")
    @classmethod
    def check_time(cls, v):
        return jakarta(v) if v is not None else v


class PeriodPreference(Contract):
    period: Literal["morning", "afternoon", "evening"]
    categories: list[Id]


class CostAssumptions(Contract):
    """User-supplied estimates, never represented as provider facts."""

    foodPersonIdr: Money | None = None
    lodgingRoomNightIdr: Money | None = None
    vehicleDayIdr: Money | None = None


class TravelRequest(Contract):
    schemaVersion: Literal[1]
    destinationId: Id
    destinationName: Text | None = None
    startDate: LocalDate
    days: Annotated[int, Field(strict=True, ge=1, le=3)]
    timezone: Literal["Asia/Jakarta"]
    travelers: Travelers
    transportMode: Literal["driving"]
    budget: Budget
    dayWindows: list[DayWindow] = Field(min_length=1, max_length=3)
    arrivalAnchor: Coordinates
    departureAnchor: Coordinates
    lodging: Lodging | None
    interests: list[Id] = Field(max_length=12)
    periodPreferences: list[PeriodPreference] = Field(max_length=3)
    mustVisitPlaceIds: list[Id] = Field(max_length=18)
    excludedPlaceIds: list[Id] = Field(max_length=35)
    objective: Literal["balanced", "budget", "travel_time"]
    costAssumptions: CostAssumptions = Field(default_factory=CostAssumptions)
    allowUnverifiedData: StrictBool
    _date = field_validator("startDate")(local_date)

    @model_validator(mode="after")
    def consistent_request(self):
        expected = [
            (date.fromisoformat(self.startDate) + timedelta(days=i)).isoformat()
            for i in range(self.days)
        ]
        if [w.date for w in self.dayWindows] != expected:
            raise ValueError("dayWindows must cover consecutive trip dates in order")
        if self.days > 1 and (
            self.lodging is None or self.lodging.nights != self.days - 1
        ):
            raise ValueError("multi-day trip requires lodging for days - 1 nights")
        if self.days == 1 and self.lodging is not None:
            raise ValueError("single-day trip does not include overnight lodging")
        if (
            self.lodging
            and self.lodging.checkInAt
            and self.lodging.checkInAt.date().isoformat() != self.startDate
        ):
            raise ValueError("checkInAt must be on first trip date")
        for ids in [self.mustVisitPlaceIds, self.excludedPlaceIds]:
            if len(ids) != len(set(ids)):
                raise ValueError("duplicate place identifiers")
        if set(self.mustVisitPlaceIds) & set(self.excludedPlaceIds):
            raise ValueError("mandatory and excluded places conflict")
        return self


class TravelLeg(Contract):
    fromId: Id
    toId: Id
    mode: Literal["driving"]
    distanceMeters: Annotated[int, Field(strict=True, ge=0)]
    estimatedDurationMin: Annotated[int, Field(strict=True, ge=0)]
    schedulingBufferMin: Annotated[int, Field(strict=True, ge=0)]
    source: Literal["curated_road_matrix", "provider", "haversine"]
    evidence: Evidence

    @model_validator(mode="after")
    def approximation(self):
        if self.source == "haversine" and self.evidence.status == "checked":
            raise ValueError(
                "Haversine duration is an estimate, not checked road travel"
            )
        return self


class StopLock(Contract):
    type: Literal["none", "place_day", "place_time"]
    arrivalAt: Timestamp | None

    @model_validator(mode="after")
    def fixed_time(self):
        if (self.type == "place_time") != (self.arrivalAt is not None):
            raise ValueError("only place_time lock requires arrivalAt")
        if self.arrivalAt is not None:
            jakarta(self.arrivalAt)
        return self


class ScheduledStop(Contract):
    id: Id
    placeId: Id
    dayIndex: Annotated[int, Field(strict=True, ge=0, le=2)]
    arrivalAt: Timestamp
    departureAt: Timestamp
    visitDurationMin: Positive
    incomingLeg: TravelLeg
    status: Literal["planned", "completed"]
    lock: StopLock
    selectionReasons: list[Text]
    _timestamps = field_validator("arrivalAt", "departureAt")(jakarta)

    @model_validator(mode="after")
    def ordered(self):
        if self.departureAt - self.arrivalAt != timedelta(
            minutes=self.visitDurationMin
        ):
            raise ValueError("departure must equal arrival plus visit duration")
        if self.incomingLeg.toId != self.placeId:
            raise ValueError("incoming leg target must match place")
        if self.lock.type == "place_time" and self.lock.arrivalAt != self.arrivalAt:
            raise ValueError("fixed lock must match arrival")
        return self


class Violation(Contract):
    code: Id
    dayIndex: Annotated[int, Field(strict=True, ge=0, le=2)] | None
    stopIds: list[Id]
    message: Text


class ItineraryDay(Contract):
    date: LocalDate
    startAnchor: Coordinates
    endAnchor: Coordinates
    stops: list[ScheduledStop]
    finalLeg: TravelLeg | None
    _date = field_validator("date")(local_date)


class LedgerItem(Contract):
    id: Id
    category: Literal["ticket", "food", "transport", "lodging"]
    placeId: Id | None
    quantity: Positive
    unitAmountIdr: Money | None
    totalIdr: Money | None
    evidence: Evidence

    @model_validator(mode="after")
    def arithmetic(self):
        if self.unitAmountIdr is None:
            if self.totalIdr is not None or self.evidence.status != "unverified":
                raise ValueError(
                    "unknown unit price requires unknown total and unverified evidence"
                )
        elif self.totalIdr != self.quantity * self.unitAmountIdr:
            raise ValueError("ledger total differs from quantity times unit amount")
        return self


class Totals(Contract):
    knownCostIdr: Money
    unknownCostItems: Annotated[int, Field(strict=True, ge=0)]
    travelMin: Annotated[int, Field(strict=True, ge=0)]
    distanceMeters: Annotated[int, Field(strict=True, ge=0)]


class ReportedClosure(Contract):
    placeId: Id
    date: LocalDate
    _date = field_validator("date")(local_date)


class DayProgress(Contract):
    date: LocalDate
    notBefore: Timestamp
    location: Coordinates
    _date = field_validator("date")(local_date)
    _time = field_validator("notBefore")(jakarta)

    @model_validator(mode="after")
    def same_date(self):
        if self.notBefore.date().isoformat() != self.date:
            raise ValueError("progress time must be on the declared date")
        return self


class ReplanState(Contract):
    closures: list[ReportedClosure] = Field(default_factory=list, max_length=35)
    progress: list[DayProgress] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def unique_progress(self):
        if len({p.date for p in self.progress}) != len(self.progress):
            raise ValueError("duplicate progress date")
        return self


class Itinerary(Contract):
    schemaVersion: Literal[1]
    id: Id
    revision: Positive
    request: TravelRequest
    datasetVersion: Id
    plannerVersion: Id
    replanState: ReplanState = Field(default_factory=ReplanState)
    places: list[Place]
    days: list[ItineraryDay]
    ledger: list[LedgerItem]
    totals: Totals
    feasibility: Literal["satisfied", "violated", "undetermined"]
    searchOutcome: Literal["plan_found", "proven_conflict", "no_plan_found"]
    violations: list[Violation]
    uncertainties: list[Text]

    @model_validator(mode="after")
    def consistency(self):
        if [d.date for d in self.days] != [w.date for w in self.request.dayWindows]:
            raise ValueError("itinerary dates must match request")
        dates = {d.date for d in self.days}
        if any(p.date not in dates for p in self.replanState.progress) or any(
            c.date not in dates for c in self.replanState.closures
        ):
            raise ValueError("replan state must belong to trip dates")
        place_ids = [p.id for p in self.places]
        stops = [s for d in self.days for s in d.stops]
        for ids in [
            place_ids,
            [s.id for s in stops],
            [s.placeId for s in stops],
            [x.id for x in self.ledger],
        ]:
            if len(ids) != len(set(ids)):
                raise ValueError("duplicate itinerary identifiers")
        for i, d in enumerate(self.days):
            for s in d.stops:
                if (
                    s.placeId not in place_ids
                    or s.dayIndex != i
                    or s.arrivalAt.date().isoformat() != d.date
                ):
                    raise ValueError("invalid stop reference/date/day index")
        if self.totals.knownCostIdr != sum(x.totalIdr or 0 for x in self.ledger):
            raise ValueError("known cost must match ledger")
        if self.totals.unknownCostItems != sum(x.totalIdr is None for x in self.ledger):
            raise ValueError("unknown count must match ledger")
        if self.feasibility == "satisfied" and (
            self.violations or self.uncertainties or self.totals.unknownCostItems
        ):
            raise ValueError("satisfied cannot contain violations or uncertainties")
        legs = [s.incomingLeg for s in stops] + [
            d.finalLeg for d in self.days if d.finalLeg
        ]
        if self.totals.travelMin != sum(
            leg.estimatedDurationMin for leg in legs
        ) or self.totals.distanceMeters != sum(leg.distanceMeters for leg in legs):
            raise ValueError(
                "travel totals must match legs, excluding scheduling buffers"
            )
        for item in self.ledger:
            if item.placeId is not None and item.placeId not in place_ids:
                raise ValueError("unknown ledger place reference")
        if self.feasibility == "satisfied":
            selected = {s.placeId for s in stops}
            if not stops:
                raise ValueError("satisfied itinerary requires scheduled stops")
            for p in self.places:
                if p.id in selected and (
                    p.coordinates is None
                    or p.openingWindows is None
                    or any(x.amountIdr is None for x in p.prices)
                ):
                    raise ValueError(
                        "satisfied itinerary cannot contain unknown selected-place metadata"
                    )
        if self.searchOutcome == "proven_conflict" and not self.violations:
            raise ValueError("proven conflict requires violations")
        if self.feasibility == "violated" and not self.violations:
            raise ValueError("violated requires violations")
        return self


class Delay(Contract):
    type: Literal["delay"]
    minutes: Positive


class Closure(Contract):
    type: Literal["closure"]
    placeId: Id
    date: LocalDate
    _date = field_validator("date")(local_date)


class Remove(Contract):
    type: Literal["remove"]
    stopId: Id


class Replace(Contract):
    type: Literal["replace"]
    stopId: Id
    placeId: Id


class Edit(Contract):
    type: Literal["edit"]
    selectedPlaceIds: list[Id] = Field(max_length=18)
    request: TravelRequest | None = None
    locks: dict[Id, StopLock] = Field(default_factory=dict)

    @model_validator(mode="after")
    def unique_selection(self):
        if len(self.selectedPlaceIds) != len(set(self.selectedPlaceIds)):
            raise ValueError("duplicate selected place identifiers")
        if set(self.locks) - set(self.selectedPlaceIds):
            raise ValueError("locks must refer to selected places")
        return self


class ReplanRequest(Contract):
    itinerary: Itinerary
    expectedRevision: Positive
    effectiveAt: Timestamp
    currentLocation: Coordinates
    disruption: Annotated[
        Delay | Closure | Remove | Replace | Edit, Field(discriminator="type")
    ]
    _timestamp = field_validator("effectiveAt")(jakarta)

    @model_validator(mode="after")
    def revision(self):
        if self.expectedRevision != self.itinerary.revision:
            raise ValueError("expectedRevision differs from snapshot")
        dates = [d.date for d in self.itinerary.days]
        if not dates[0] <= self.effectiveAt.date().isoformat() <= dates[-1]:
            raise ValueError("effectiveAt outside trip")
        if isinstance(self.disruption, Closure) and (
            self.disruption.placeId not in [p.id for p in self.itinerary.places]
            or self.disruption.date not in dates
        ):
            raise ValueError("closure outside itinerary")
        return self


class StopChange(Contract):
    stopId: Id
    action: Literal["retained", "moved", "removed", "replaced"]
    reasonCode: Id
    explanation: Text


class BeforeAfter(Contract):
    costDeltaIdr: Annotated[int, Field(strict=True)] | None
    travelDeltaMin: Annotated[int, Field(strict=True)]
    removedOptionalStops: Annotated[int, Field(strict=True, ge=0)]


class ReplanResult(Contract):
    status: Literal["repaired", "needs_user_decision", "no_plan_found"]
    revised: Itinerary | None
    disruptedOriginalViolations: list[Violation]
    changes: list[StopChange]
    beforeAfter: BeforeAfter

    @model_validator(mode="after")
    def repaired(self):
        if self.status == "repaired" and (
            self.revised is None or self.revised.feasibility == "violated"
        ):
            raise ValueError("repaired requires satisfied revised itinerary")
        return self


class PilotDataset(Contract):
    schemaVersion: Literal[1]
    datasetVersion: Id
    destinationId: Id
    places: Annotated[list[Place], Field(min_length=1)]

    @model_validator(mode="after")
    def unique(self):
        ids = [p.id for p in self.places]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate dataset IDs")
        return self
